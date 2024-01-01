using LSPD_First_Response.Engine.Scripting.Entities;
using LSPD_First_Response.Mod.API;
using Rage;
using StopThePed.API;
using System;
using System.IO;
using System.Collections.Specialized;
using System.Web;
using System.Linq;
using LSPD_First_Response.Engine.Scripting;
using LSPD_First_Response.Mod.Callouts;

namespace ExternalPoliceComputer {
    internal class Main : Plugin {

        internal static bool CurrentlyOnDuty;
        internal static readonly int MaxNumberOfNearbyPedsOrVehicles = 15;
        internal static Ped Player => Game.LocalPlayer.Character;
        internal static readonly string DataPath = "EPC/data";
        internal static bool UseSTP = true;
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

                useCI = DependencyCheck.IsCIAvailable();

                Game.LogTrivial($"ExternalPoliceComputer: CI: {useCI}");

                if (useCI) AddCalloutEventWithCI();

                LSPD_First_Response.Mod.API.Events.OnPulloverStarted += Events_OnPulloverStarted;
                LSPD_First_Response.Mod.API.Events.OnPursuitEnded += Events_OnPursuitEnded;

                GameFiber IntervalFiber = GameFiber.StartNew(Interval);

                try {
                    AddEventsWithSTP();
                } catch {
                    UseSTP = false;
                    
                    LSPD_First_Response.Mod.API.Events.OnPedPresentedId += Events_OnPedPresentedId;
                    LSPD_First_Response.Mod.API.Events.OnPedArrested += Events_OnPedArrested;
                    LSPD_First_Response.Mod.API.Events.OnPedFrisked += Events_OnPedFrisked;
                    LSPD_First_Response.Mod.API.Events.OnPedStopped += Events_OnPedStopped;
                }
                Game.LogTrivial($"ExternalPoliceComputer: STP: {UseSTP}");

                UpdateWorldPeds();
                UpdateWorldCars();

                Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
            }
        }

        private static void AddEventsWithSTP() {
            StopThePed.API.Events.askIdEvent += Events_askIdEvent;
            StopThePed.API.Events.pedArrestedEvent += Events_pedArrestedEvent;
            StopThePed.API.Events.patDownPedEvent += Events_patDownPedEvent;
            StopThePed.API.Events.askDriverLicenseEvent += Events_askDriverLicenseEvent;
            StopThePed.API.Events.askPassengerIdEvent += Events_askPassengerIdEvent;
            StopThePed.API.Events.stopPedEvent += Events_stopPedEvent;
        }

        private static void AddCalloutEventWithCI() {
            LSPD_First_Response.Mod.API.Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
            LSPD_First_Response.Mod.API.Events.OnCalloutFinished += Events_OnCalloutFinished;
            LSPD_First_Response.Mod.API.Events.OnCalloutAccepted += Events_OnCalloutAccepted;
            void Events_OnCalloutDisplayed(LHandle handle) {
                Game.LogTrivial("ExternalPoliceComputer: Update callout.data");
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                string agency = LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName();
                string priority = "Code 2";
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
                    description = calloutInterfaceInfo.Description;
                    name = calloutInterfaceInfo.Name;
                }

                string street = World.GetStreetName(World.GetStreetHash(callout.CalloutPosition));
                WorldZone zone = LSPD_First_Response.Mod.API.Functions.GetZoneAtPosition(callout.CalloutPosition);

                string calloutData = $"id={new Random().Next(10000, 100000)}&name={name}&description={description}&message={callout.CalloutMessage}&advisory={callout.CalloutAdvisory}&callsign={callsign}&agency={agency}&priority={priority}&postal={CalloutInterface.API.Functions.GetPostalCode(callout.CalloutPosition)}&street={street}&area={zone.RealAreaName}&county={zone.County}&position={callout.CalloutPosition}&acceptanceState={callout.AcceptanceState}&displayedTime={DateTime.Now.ToLocalTime():s}&additionalMessage=";
                File.WriteAllText($"{Main.DataPath}/callout.data", calloutData);
                Game.LogTrivial("ExternalPoliceComputer: Updated callout.data");
            }

            void Events_OnCalloutAccepted(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                Main.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                Main.UpdateCalloutData("acceptedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }

            void Events_OnCalloutFinished(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                Main.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                Main.UpdateCalloutData("finishedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }
        }

        internal static void UpdateCalloutData(string key, string value) {
            Game.LogTrivial("ExternalPoliceComputer: Update callout.data");
            NameValueCollection calloutData = HttpUtility.ParseQueryString(File.ReadAllText($"{Main.DataPath}/callout.data"));

            calloutData.Set(key, value);

            string[] calloutDataQueryArr = new string[calloutData.Count];
            for (int i = 0; i < calloutData.Count; i++) {
                calloutDataQueryArr[i] = $"{calloutData.GetKey(i)}={calloutData.GetValues(i).FirstOrDefault()}";
            }

            File.WriteAllText($"{Main.DataPath}/callout.data", string.Join("&", calloutDataQueryArr));
            Game.LogTrivial("ExternalPoliceComputer: Updated callout.data");
        }

        private static void Interval() {
            while (CurrentlyOnDuty) {
                UpdateWorldPeds();
                UpdateWorldCars();
                GameFiber.Wait(15000);
            }
        }

        // STP
        private static void Events_askIdEvent(Ped ped) {
            AddWorldPed(ped);
            UpdateCurrentID(ped);
        }

        private static void Events_pedArrestedEvent(Ped ped) {
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
        // STP
        private static string GetRegistration(Vehicle car) {
            switch (StopThePed.API.Functions.getVehicleRegistrationStatus(car)) {
                case STPVehicleStatus.Expired:
                    return "Expired";
                case STPVehicleStatus.None:
                    return "None";
                case STPVehicleStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        private static string GetInsurance(Vehicle car) {
            switch (StopThePed.API.Functions.getVehicleInsuranceStatus(car)) {
                case STPVehicleStatus.Expired:
                    return "Expired";
                case STPVehicleStatus.None:
                    return "None";
                case STPVehicleStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        // get world data
        private static string GetWorldPedData(Ped ped) {
            Persona persona = LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(ped);
            string birthday = $"{persona.Birthday.Month}/{persona.Birthday.Day}/{persona.Birthday.Year}";
            return $"name={persona.FullName}&birthday={birthday}&gender={persona.Gender}&isWanted={persona.Wanted}&licenseStatus={persona.ELicenseState}&relationshipGroup={ped.RelationshipGroup.Name}";
        }

        private static string GetWorldCarData(Vehicle car) {
            string driver = car.Driver.Exists() ? LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(car.Driver).FullName : "";
            string color = Rage.Native.NativeFunction.Natives.GET_VEHICLE_LIVERY<int>(car) != -1 ? "" : $"{car.PrimaryColor.R}-{car.PrimaryColor.G}-{car.PrimaryColor.B}";
            if (UseSTP) {
                return $"licensePlate={car.LicensePlate}&model={car.Model.Name}&isStolen={car.IsStolen}&isPolice={car.IsPoliceVehicle}&owner={LSPD_First_Response.Mod.API.Functions.GetVehicleOwnerName(car)}&driver={driver}&registration={GetRegistration(car)}&insurance={GetInsurance(car)}&color={color}";
            } else {
                return $"licensePlate={car.LicensePlate}&model={car.Model.Name}&isStolen={car.IsStolen}&isPolice={car.IsPoliceVehicle}&owner={LSPD_First_Response.Mod.API.Functions.GetVehicleOwnerName(car)}&driver={driver}&color={color}";
            }
        }

        // update world data
        private static void UpdateWorldPeds() {
            Game.LogTrivial("ExternalPoliceComputer: Update worldPeds.data");
            if (!Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldPeds.data; Invalid Player");
                return;
            }
            Ped[] allPeds = Player.GetNearbyPeds(MaxNumberOfNearbyPedsOrVehicles);
            string[] persList = new string[allPeds.Length];

            for (int i = 0; i < allPeds.Length; i++) {
                Ped ped = allPeds[i];
                if (ped.Exists()) {
                    persList[Array.IndexOf(allPeds, ped)] = GetWorldPedData(ped);
                }
            }

            File.WriteAllText($"{DataPath}/worldPeds.data", string.Join(",", persList));

            Game.LogTrivial("ExternalPoliceComputer: Updated worldPeds.data");
        }

        private static void UpdateWorldCars() {
            Game.LogTrivial("ExternalPoliceComputer: Update worldCars.data");
            if (!Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldCars.data; Invalid Player");
                return;
            }
            Vehicle[] allCars = Player.GetNearbyVehicles(MaxNumberOfNearbyPedsOrVehicles);
            string[] carsList = new string[allCars.Length];

            for (int i = 0; i < allCars.Length; i++) {
                Vehicle car = allCars[i];
                if (car.Exists()) {
                    carsList[Array.IndexOf(allCars, car)] = GetWorldCarData(car);
                }
            }
            File.WriteAllText($"{DataPath}/worldCars.data", string.Join(",", carsList));
            Game.LogTrivial("ExternalPoliceComputer: Updated worldCars.data");
        }

        private static void UpdateCurrentID(Ped ped) {
            Game.LogTrivial("ExternalPoliceComputer: Update currentID.data");

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

            Game.LogTrivial("ExternalPoliceComputer: Updated currentID.data");
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

        private static void AddWorldCar(Vehicle car) {
            if (car.Exists()) {
                string data = GetWorldCarData(car);
                string oldFile = File.ReadAllText($"{DataPath}/worldCars.data");
                if (oldFile.Contains(car.LicensePlate)) return;

                string addComma = oldFile.Length > 0 ? "," : "";

                File.WriteAllText($"{DataPath}/worldCars.data", $"{oldFile}{addComma}{data}");
            }
        }
    }
}