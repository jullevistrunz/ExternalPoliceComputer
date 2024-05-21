using LSPD_First_Response.Engine.Scripting.Entities;
using LSPD_First_Response.Mod.API;
using Rage;
using System;
using System.IO;
using System.Collections.Specialized;
using System.Web;
using System.Linq;
using LSPD_First_Response.Engine.Scripting;
using LSPD_First_Response.Mod.Callouts;
using CommonDataFramework.Modules.VehicleDatabase;
using CommonDataFramework.Modules.PedDatabase;
using CommonDataFramework.Modules;

namespace ExternalPoliceComputer {
    internal class Main : Plugin {

        internal static bool CurrentlyOnDuty;
        internal static readonly int MaxNumberOfNearbyPedsOrVehicles = 15;
        internal static Ped Player => Game.LocalPlayer.Character;
        internal static readonly string DataPath = "EPC/data";
        internal static bool usePR = false;
        internal static bool useCI = false;

        public override void Initialize() {
            LSPD_First_Response.Mod.API.Functions.OnOnDutyStateChanged += Functions_OnOnDutyStateChanged;
            Game.LogTrivial("ExternalPoliceComputer has been initialized.");
        }

        public override void Finally() {
            Game.LogTrivial("ExternalPoliceComputer has been unloaded.");
        }

        private static void Functions_OnOnDutyStateChanged(bool OnDuty) {
            CurrentlyOnDuty = OnDuty;
            if (OnDuty) {

                if (!Directory.Exists(DataPath)) {
                    Game.DisplayNotification("ExternalPoliceComputer failed to load. Couldn't find data path.");
                    Game.LogTrivial("ExternalPoliceComputer: Loading aborted. Couldn't find data path.");
                    return;
                }

                if (!DependencyCheck.IsCIAPIAvailable()) {
                    Game.DisplayNotification("ExternalPoliceComputer failed to load. Couldn't find CalloutInterfaceAPI.");
                    Game.LogTrivial("ExternalPoliceComputer: Loading aborted. Couldn't find CalloutInterfaceAPI.");
                    return;
                }

                if (!DependencyCheck.IsCDFAvailable()) {
                    Game.DisplayNotification("ExternalPoliceComputer failed to load. Couldn't find CommonDataFramework.");
                    Game.LogTrivial("ExternalPoliceComputer: Loading aborted. Couldn't find CommonDataFramework.");
                    return;
                }

                useCI = DependencyCheck.IsCIAvailable();

                Game.LogTrivial($"ExternalPoliceComputer: CI: {useCI}");

                if (useCI) AddCalloutEventWithCI();

                LSPD_First_Response.Mod.API.Events.OnPulloverStarted += LSPDFREvents.Events_OnPulloverStarted;
                LSPD_First_Response.Mod.API.Events.OnPursuitEnded += LSPDFREvents.Events_OnPursuitEnded;

                usePR = DependencyCheck.IsPRAvailable();

                Game.LogTrivial($"ExternalPoliceComputer: PR: {usePR}");

                if (usePR) {
                    PREvents.SubscribeToPREvents();
                }
                else {
                    LSPDFREvents.SubscribeToFREvents();
                }

                DataToClient.UpdateWorldPeds();
                DataToClient.UpdateWorldCars();

                GameFiber IntervalFiber = GameFiber.StartNew(UpdateWorldDataInterval);

                GameFiber AnimationFiber = GameFiber.StartNew(ListenForAnimationFileChange);

                Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
            }
        }

        private static void AddCalloutEventWithCI() {
            LSPD_First_Response.Mod.API.Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
            LSPD_First_Response.Mod.API.Events.OnCalloutFinished += Events_OnCalloutFinished;
            LSPD_First_Response.Mod.API.Events.OnCalloutAccepted += Events_OnCalloutAccepted;
            void Events_OnCalloutDisplayed(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                string agency = LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName();
                string priority = "default";
                string description = "";
                string name = callout.FriendlyName;
                string callsign = IPT.Common.Handlers.PlayerHandler.GetCallsign();

                // opus49 came up with this (and I just modified it a bit)
                if (callout.ScriptInfo is CalloutInterfaceAPI.CalloutInterfaceAttribute calloutInterfaceInfo) {
                    if (calloutInterfaceInfo.Agency.Length > 0) {
                        agency = calloutInterfaceInfo.Agency;
                    }
                    if (calloutInterfaceInfo.Priority.Length > 0) {
                        priority = calloutInterfaceInfo.Priority;
                    }
                    description = MakeStringWorkWithMyStupidQueryStrings(calloutInterfaceInfo.Description);
                    name = MakeStringWorkWithMyStupidQueryStrings(calloutInterfaceInfo.Name);
                }

                string street = World.GetStreetName(World.GetStreetHash(callout.CalloutPosition));
                WorldZone zone = LSPD_First_Response.Mod.API.Functions.GetZoneAtPosition(callout.CalloutPosition);

                string calloutData = DataToClient.PrintObjects(
                    ("id", new Random().Next(10000, 100000).ToString()),
                    ("name", name),
                    ("description", description),
                    ("message", MakeStringWorkWithMyStupidQueryStrings(callout.CalloutMessage)),
                    ("advisory", MakeStringWorkWithMyStupidQueryStrings(callout.CalloutAdvisory)),
                    ("callsign", callsign),
                    ("agency", agency),
                    ("priority", priority),
                    ("postal", CalloutInterface.API.Functions.GetPostalCode(callout.CalloutPosition)),
                    ("street", street),
                    ("area", zone.RealAreaName),
                    ("county", zone.County.ToString()),
                    ("position", callout.CalloutPosition.ToString()),
                    ("acceptanceState", callout.AcceptanceState.ToString()),
                    ("displayedTime", DateTime.Now.ToLocalTime().ToString("s")),
                    ("additionalMessage", "")
                    );

                File.WriteAllText($"{DataPath}/callout.data", calloutData);
            }

            void Events_OnCalloutAccepted(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                DataToClient.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                DataToClient.UpdateCalloutData("acceptedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }

            void Events_OnCalloutFinished(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                DataToClient.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                DataToClient.UpdateCalloutData("finishedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }
        }

        internal static string MakeStringWorkWithMyStupidQueryStrings(string message) {
            if (string.IsNullOrEmpty(message)) return message;
            message = message.Replace("&", "%26");
            message = message.Replace("=", "%3D");
            message = message.Replace("?", "%3F");
            message = message.Replace(";", "%3B");
            return message;
        }

        private static void UpdateWorldDataInterval() {
            while (CurrentlyOnDuty) {
                DataToClient.UpdateWorldPeds();
                DataToClient.UpdateWorldCars();
                GameFiber.Wait(15000);
            }
        }

        private static void ListenForAnimationFileChange() {
            FileSystemWatcher watcher = new FileSystemWatcher(DataPath);
            watcher.Filter = "animation.data";
            watcher.EnableRaisingEvents = true;
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Changed += (object sender, FileSystemEventArgs e) => {
                if (e.ChangeType != WatcherChangeTypes.Changed) {
                    return;
                }

                NameValueCollection file = new NameValueCollection();

                try {
                    file = HttpUtility.ParseQueryString(File.ReadAllText($"{DataPath}/animation.data"));
                } catch (Exception ex) {
                    Game.LogTrivial(ex.ToString());
                }
                

                switch (file["type"]) {
                    case "giveCitation":
                        Game.LogTrivial(file["name"]);

                        Ped ped = Player.GetNearbyPeds(MaxNumberOfNearbyPedsOrVehicles).FirstOrDefault(x => x.GetPedData().FullName == file["name"]);
                        
                        if (ped == null) break;

                        Game.LogTrivial(ped.GetPedData().FullName);

                        PolicingRedefined.Interaction.Assets.PedAttributes.Citation citation = new PolicingRedefined.Interaction.Assets.PedAttributes.Citation(ped, file["text"], int.Parse(file["fine"]), bool.Parse(file["isArrestable"]));
                        PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, citation);
                        break;
                }
            };
        }
    }
}