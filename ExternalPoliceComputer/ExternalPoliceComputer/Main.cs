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

                LSPD_First_Response.Mod.API.Events.OnPulloverStarted += Events_OnPulloverStarted;
                LSPD_First_Response.Mod.API.Events.OnPursuitEnded += Events_OnPursuitEnded;

                usePR = DependencyCheck.IsPRAvailable();

                Game.LogTrivial($"ExternalPoliceComputer: PR: {usePR}");

                if (usePR) { 
                    AddEventsWithPR(); 
                }
                else {
                    LSPD_First_Response.Mod.API.Events.OnPedPresentedId += Events_OnPedPresentedId;
                    LSPD_First_Response.Mod.API.Events.OnPedArrested += Events_OnPedArrested;
                    LSPD_First_Response.Mod.API.Events.OnPedFrisked += Events_OnPedFrisked;
                    LSPD_First_Response.Mod.API.Events.OnPedStopped += Events_OnPedStopped;
                }

                UpdateWorldPeds();
                UpdateWorldCars();

                GameFiber IntervalFiber = GameFiber.StartNew(Interval);

                GameFiber AnimationFiber = GameFiber.StartNew(ListenForAnimationFileChange);

                Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
            }
        }

        private static void AddEventsWithPR() {
            PolicingRedefined.API.EventsAPI.OnPedPatDown += Events_patDownPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedStopped += Events_stopPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedArrested += Events_pedArrestedEvent;
            // StopThePed.API.Events.askIdEvent += Events_askIdEvent;
            // StopThePed.API.Events.askDriverLicenseEvent += Events_askDriverLicenseEvent;
            // StopThePed.API.Events.askPassengerIdEvent += Events_askPassengerIdEvent;
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

                string calloutData = $"id={new Random().Next(10000, 100000)}&name={name}&description={description}&message={MakeStringWorkWithMyStupidQueryStrings(callout.CalloutMessage)}&advisory={MakeStringWorkWithMyStupidQueryStrings(callout.CalloutAdvisory)}&callsign={callsign}&agency={agency}&priority={priority}&postal={CalloutInterface.API.Functions.GetPostalCode(callout.CalloutPosition)}&street={street}&area={zone.RealAreaName}&county={zone.County}&position={callout.CalloutPosition}&acceptanceState={callout.AcceptanceState}&displayedTime={DateTime.Now.ToLocalTime():s}&additionalMessage=";
                File.WriteAllText($"{DataPath}/callout.data", calloutData);
            }

            void Events_OnCalloutAccepted(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                UpdateCalloutData("acceptedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }

            void Events_OnCalloutFinished(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                UpdateCalloutData("finishedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }
        }

        internal static void UpdateCalloutData(string key, string value) {
            NameValueCollection calloutData = HttpUtility.ParseQueryString(File.ReadAllText($"{DataPath}/callout.data"));

            calloutData.Set(key, value);

            string[] calloutDataQueryArr = new string[calloutData.Count];
            for (int i = 0; i < calloutData.Count; i++) {
                calloutDataQueryArr[i] = $"{calloutData.GetKey(i)}={calloutData.GetValues(i).FirstOrDefault()}";
            }

            File.WriteAllText($"{DataPath}/callout.data", string.Join("&", calloutDataQueryArr));
        }

        internal static string MakeStringWorkWithMyStupidQueryStrings(string message) {
            if (string.IsNullOrEmpty(message)) return message;
            message = message.Replace("&", "%26");
            message = message.Replace("=", "%3D");
            message = message.Replace("?", "%3F");
            message = message.Replace(";", "%3B");
            return message;
        }

        private static void Interval() {
            while (CurrentlyOnDuty) {
                UpdateWorldPeds();
                UpdateWorldCars();
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

        // PR
        private static void Events_askIdEvent(Ped ped) {
            AddWorldPed(ped);
            UpdateCurrentID(ped);
        }

        private static void Events_pedArrestedEvent(Ped ped, Ped officer, bool frontCuffs) {
            AddWorldPed(ped);
        }

        private static void Events_patDownPedEvent(Ped ped) {
            AddWorldPed(ped);
            UpdateCurrentID(ped);
        }

        private static void Events_askDriverLicenseEvent(Ped ped) {
            AddWorldPed(ped);
            UpdateCurrentID(ped);
        }

        private static void Events_askPassengerIdEvent(Vehicle vehicle) {
            Ped[] passengers = vehicle.Passengers;
            for (int i = 0; i < passengers.Length; i++) {
                UpdateCurrentID(passengers[i]);
            }
        }

        private static void Events_stopPedEvent(Ped ped) {
            AddWorldPed(ped);
        }

        // LSPDFR
        private static void Events_OnPulloverStarted(LHandle handle) {
            UpdateWorldPeds();
            UpdateWorldCars();
        }

        private static void Events_OnPursuitEnded(LHandle handle) {
            UpdateWorldPeds();
            UpdateWorldCars();
        }

        private static void Events_OnPedPresentedId(Ped ped, LHandle pullover, LHandle pedInteraction) {
            AddWorldPed(ped);
            UpdateCurrentID(ped);
        }

        private static void Events_OnPedArrested(Ped suspect, Ped arrestingOfficer) {
            AddWorldPed(suspect);
        }

        private static void Events_OnPedFrisked(Ped suspect, Ped friskingOfficer) {
            AddWorldPed(suspect);
            UpdateCurrentID(suspect);
        }

        private static void Events_OnPedStopped(Ped ped) {
            AddWorldPed(ped);
        }

        // world data
        // PR
        private static string GetRegistration(Vehicle car) {
            switch (VehicleDataController.GetVehicleData(car).Registration.Status) {
                case EDocumentStatus.Revoked:
                case EDocumentStatus.Expired:
                    return "Expired";
                case EDocumentStatus.None:
                    return "None";
                case EDocumentStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        private static string GetInsurance(Vehicle car) {
            switch (VehicleDataController.GetVehicleData(car).Insurance.Status) {
                case EDocumentStatus.Revoked:
                case EDocumentStatus.Expired:
                    return "Expired";
                case EDocumentStatus.None:
                    return "None";
                case EDocumentStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        // get world data
        private static string GetWorldPedData(Ped ped) {
            PedData pedData = ped.GetPedData();
            if (pedData == null) return null;
            string birthday = $"{pedData.Birthday.Month}/{pedData.Birthday.Day}/{pedData.Birthday.Year}";
            return PrintObjects(
                ("name", pedData.FullName),
                ("birthday", birthday),
                ("gender", pedData.Gender.ToString()),
                ("isWanted", pedData.Wanted.ToString()),
                ("licenseStatus", pedData.DriversLicenseState.ToString()),
                ("licenseExpiration", pedData.DriversLicenseExpiration.ToString()),
                ("relationshipGroup", ped.RelationshipGroup.Name),
                ("isOnProbation", pedData.IsOnProbation.ToString()),
                ("isOnParole", pedData.IsOnParole.ToString()),
                ("weaponPermitPermitType", pedData.WeaponPermit.PermitType.ToString()),
                ("weaponPermitStatus", pedData.WeaponPermit.Status.ToString()),
                ("weaponPermitExpirationDate", pedData.WeaponPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("fishingPermitStatus", pedData.FishingPermit.Status.ToString()),
                ("fishingPermitExpirationDate", pedData.FishingPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("huntingPermitStatus", pedData.HuntingPermit.Status.ToString()),
                ("huntingPermitExpirationDate", pedData.HuntingPermit.ExpirationDate.ToLocalTime().ToString("s"))
                );
        }

        private static string GetWorldCarData(Vehicle car) {
            string driver = car.Driver.Exists() ? LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(car.Driver).FullName : "";
            string color = Rage.Native.NativeFunction.Natives.GET_VEHICLE_LIVERY<int>(car) != -1 ? "" : $"{car.PrimaryColor.R}-{car.PrimaryColor.G}-{car.PrimaryColor.B}";

            AddWorldPedWithPedData(VehicleDataController.GetVehicleData(car).Owner);

            return PrintObjects(
                ("licensePlate", VehicleDataController.GetVehicleData(car).LicensePlate),
                ("model", car.Model.Name),
                ("isStolen", VehicleDataController.GetVehicleData(car).IsStolen.ToString()),
                ("isPolice", car.IsPoliceVehicle.ToString()),
                ("owner", VehicleDataController.GetVehicleData(car).Owner.FullName),
                ("driver", driver),
                ("registration", GetRegistration(car)),
                ("insurance", GetInsurance(car)),
                ("color", color)
                );
        }

        // update world data
        private static void UpdateWorldPeds() {
            if (!Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldPeds.data; Invalid Player");
                return;
            }
            Ped[] allPeds = Player.GetNearbyPeds(MaxNumberOfNearbyPedsOrVehicles);
            string[] persList = new string[allPeds.Length];

            for (int i = 0; i < allPeds.Length; i++) {
                Ped ped = allPeds[i];
                if (ped.Exists() && ped.IsHuman) {
                    persList[i] = GetWorldPedData(ped);
                }
            }

            persList = persList.Where(x => !string.IsNullOrEmpty(x)).ToArray();

            File.WriteAllText($"{DataPath}/worldPeds.data", string.Join(",", persList));
        }

        private static void UpdateWorldCars() {
            if (!Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldCars.data; Invalid Player");
                return;
            }
            Vehicle[] allCars = Player.GetNearbyVehicles(MaxNumberOfNearbyPedsOrVehicles);
            string[] carsList = new string[allCars.Length];

            for (int i = 0; i < allCars.Length; i++) {
                Vehicle car = allCars[i];
                if (car.Exists()) {
                    carsList[i] = GetWorldCarData(car);
                }
            }

            carsList = carsList.Where(x => !string.IsNullOrEmpty(x)).ToArray();

            File.WriteAllText($"{DataPath}/worldCars.data", string.Join(",", carsList));
        }

        private static void UpdateCurrentID(Ped ped) {
            int index = 0;
            if (ped.IsInAnyVehicle(false)) {
                index = ped.SeatIndex + 2;
            }

            string oldFile = File.ReadAllText($"{DataPath}/currentID.data");

            Persona persona = LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(ped);

            if (oldFile.Contains(persona.FullName)) return;

            string birthday = $"{persona.Birthday.Month}/{persona.Birthday.Day}/{persona.Birthday.Year}";

            string data = $"{persona.FullName},{birthday},{persona.Gender},{index};";

            File.WriteAllText($"{DataPath}/currentID.data", File.ReadAllText($"{DataPath}/currentID.data") + data);
        }

        private static void AddWorldPed(Ped ped) {
            if (ped.Exists()) {
                string data = GetWorldPedData(ped);
                string oldFile = File.ReadAllText($"{DataPath}/worldPeds.data");
                if (oldFile.Contains(LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(ped).FullName)) return;

                string addComma = oldFile.Length > 0 ? "," : "";

                File.WriteAllText($"{DataPath}/worldPeds.data", $"{oldFile}{addComma}{data}");
            } 
        }

        private static void AddWorldPedWithPedData(PedData pedData) {
            string birthday = $"{pedData.Birthday.Month}/{pedData.Birthday.Day}/{pedData.Birthday.Year}";
            string data = PrintObjects(
                ("name", pedData.FullName),
                ("birthday", birthday),
                ("gender", pedData.Gender.ToString()),
                ("isWanted", pedData.Wanted.ToString()),
                ("licenseStatus", pedData.DriversLicenseState.ToString()),
                ("licenseExpiration", pedData.DriversLicenseExpiration.ToString()),
                ("relationshipGroup", pedData.HasRealPed && pedData.Holder.Exists() ? pedData.Holder.RelationshipGroup.Name : ""),
                ("isOnProbation", pedData.IsOnProbation.ToString()),
                ("isOnParole", pedData.IsOnParole.ToString()),
                ("weaponPermitPermitType", pedData.WeaponPermit.PermitType.ToString()),
                ("weaponPermitStatus", pedData.WeaponPermit.Status.ToString()),
                ("weaponPermitExpirationDate", pedData.WeaponPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("fishingPermitStatus", pedData.FishingPermit.Status.ToString()),
                ("fishingPermitExpirationDate", pedData.FishingPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("huntingPermitStatus", pedData.HuntingPermit.Status.ToString()),
                ("huntingPermitExpirationDate", pedData.HuntingPermit.ExpirationDate.ToLocalTime().ToString("s"))
                );
            string oldFile = File.ReadAllText($"{DataPath}/worldPeds.data");
            if (oldFile.Contains(pedData.FullName)) return;

            string addComma = oldFile.Length > 0 ? "," : "";

            File.WriteAllText($"{DataPath}/worldPeds.data", $"{oldFile}{addComma}{data}");
            
        }

        private static void AddWorldCar(Vehicle car) {
            if (car.Exists()) {
                string data = GetWorldCarData(car);
                string oldFile = File.ReadAllText($"{DataPath}/worldCars.data");
                if (oldFile.Contains(car.LicensePlate)) return;

                string addComma = oldFile.Length > 0 ? "," : "";

                File.WriteAllText($"{DataPath}/worldCars.data", $"{oldFile}{addComma}{data}");
            }
        }

        // Thank you RoShit
        static string PrintObjects(params (string, string)[] items) {
            string s = "";
            for (var index = 0; index < items.Length; index++) {
                var item = items[index];
                s += $"{item.Item1}={item.Item2}";
                if (index < items.Length - 1)
                    s += "&";
            }
            return s;
        }
    }
}