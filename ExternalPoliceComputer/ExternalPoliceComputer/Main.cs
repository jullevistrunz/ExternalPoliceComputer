using LSPD_First_Response.Mod.API;
using Rage;
using System.CodeDom;
using System.IO;

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
            GiveCitationsListener.watcher.EnableRaisingEvents = false;
            GiveCitationsListener.watcher.Dispose();
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

                GameFiber.StartNew(() => {
                    GameFiber.WaitUntil(CommonDataFramework.API.CDFFunctions.IsPluginReady, 30000);
                    if (!CommonDataFramework.API.CDFFunctions.IsPluginReady()) {
                        Game.DisplayNotification("ExternalPoliceComputer failed to load. CommonDataFramework didn't load (blame Marcel).");
                        Game.LogTrivial("ExternalPoliceComputer: Loading aborted. CommonDataFramework didn't load.");
                        return;
                    };

                    useCI = DependencyCheck.IsCIAvailable();

                    Game.LogTrivial($"ExternalPoliceComputer: CI: {useCI}");

                    if (useCI) CalloutEvents.AddCalloutEventWithCI();

                    LSPD_First_Response.Mod.API.Events.OnPulloverStarted += LSPDFREvents.Events_OnPulloverStarted;
                    LSPD_First_Response.Mod.API.Events.OnPursuitEnded += LSPDFREvents.Events_OnPursuitEnded;

                    usePR = DependencyCheck.IsPRAvailable();

                    Game.LogTrivial($"ExternalPoliceComputer: PR: {usePR}");

                    if (usePR) {
                        PREvents.SubscribeToPREvents();
                    } else {
                        LSPDFREvents.SubscribeToFREvents();
                    }

                    GameFiber.StartNew(UpdateWorldDataInterval, "IntervalFiber");

                    GameFiber.StartNew(GiveCitationsListener.ListenForAnimationFileChange, "GiveCitationsFiber");

                    Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
                });
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
    }
}