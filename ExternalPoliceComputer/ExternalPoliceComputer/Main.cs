using Rage;
using LSPD_First_Response.Mod.API;
using System.IO;
using System;
using Rage.Native;

namespace ExternalPoliceComputer {
    public class Main : Plugin {

        public override void Initialize() {
            Functions.OnOnDutyStateChanged += Functions_OnOnDutyStateChanged;
            Game.LogTrivial("Plugin ExternalPoliceComputer has been initialized.");
        }

        public override void Finally() {
            Game.LogTrivial("ExternalPoliceComputer has been unloaded.");
        }

        private static void Functions_OnOnDutyStateChanged(bool OnDuty) {
            if (OnDuty) {
                try {
                    addEventsWithSTP();

                    updateWorldPeds();
                    updateWorldCars();

                    Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
                } catch {
                    Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
                    Events.OnPulloverStarted += Events_OnPulloverStarted;
                    Events.OnPedPresentedId += Events_OnPedPresentedId;
                    Events.OnPedArrested += Events_OnPedArrested;

                    updateWorldPeds();
                    updateWorldCars();

                    Game.DisplayNotification("ExternalPoliceComputer has been loaded (without StopThePed).");
                }
            }
        }

        private static void addEventsWithSTP() {
            Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
            Events.OnPulloverStarted += Events_OnPulloverStarted;
            StopThePed.API.Events.askIdEvent += Events_askIdEvent;
            StopThePed.API.Events.pedArrestedEvent += Events_pedArrestedEvent;
            StopThePed.API.Events.patDownPedEvent += Events_patDownPedEvent;
            StopThePed.API.Events.askDriverLicenseEvent += Events_askDriverLicenseEvent;
        }

        private static void Events_askDriverLicenseEvent(Ped ped) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(ped);
        }

        private static void Events_patDownPedEvent(Ped ped) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(ped);
        }

        private static void Events_OnPedArrested(Ped suspect, Ped arrestingOfficer) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(suspect);
        }

        private static void Events_OnPedPresentedId(Ped ped, LHandle pullover, LHandle pedInteraction) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(ped);
        }

        private static void Events_pedArrestedEvent(Ped ped) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(ped);
        }

        private static void Events_askIdEvent(Ped ped) {
            updateWorldPeds();
            updateWorldCars();
            updateCurrentID(ped);
        }

        private static void Events_OnPulloverStarted(LHandle handle) {
            updateWorldPeds();
            updateWorldCars();
        }

        private static void Events_OnCalloutDisplayed(LHandle handle) {
            updateWorldPeds();
            updateWorldCars();
        }

        private static void updateWorldPeds() {
            Game.LogTrivial("ExternalPoliceComputer: Update worldPeds.data");
            Ped[] allPeds = World.GetAllPeds();
            string[] persList = new string[allPeds.Length];

            foreach (Ped ped in allPeds) {
                if (ped.Exists()) {
                    persList[Array.IndexOf(allPeds, ped)] = $"name={Functions.GetPersonaForPed(ped).FullName}&birthday={Functions.GetPersonaForPed(ped).Birthday.Month}/{Functions.GetPersonaForPed(ped).Birthday.Day}/{Functions.GetPersonaForPed(ped).Birthday.Year}&gender={Functions.GetPersonaForPed(ped).Gender}&isWanted={Functions.GetPersonaForPed(ped).Wanted}&licenseStatus={Functions.GetPersonaForPed(ped).ELicenseState}";
                }

            }

            File.WriteAllText("EPC/data/worldPeds.data", string.Join(",", persList));

            Game.LogTrivial("ExternalPoliceComputer: Updated worldPeds.data");
        }

        
        public static string getRegistration(Vehicle car) {
            switch (StopThePed.API.Functions.getVehicleRegistrationStatus(car)) {
                case StopThePed.API.STPVehicleStatus.Expired:
                    return "Expired";
                case StopThePed.API.STPVehicleStatus.None:
                    return "None";
                case StopThePed.API.STPVehicleStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        public static string getInsurance(Vehicle car) {
            switch (StopThePed.API.Functions.getVehicleInsuranceStatus(car)) {
                case StopThePed.API.STPVehicleStatus.Expired:
                    return "Expired";
                case StopThePed.API.STPVehicleStatus.None:
                    return "None";
                case StopThePed.API.STPVehicleStatus.Valid:
                    return "Valid";
            }
            return "";
        }

        private static void updateWorldCarsWithSTP() {
            Vehicle[] allCars = World.GetAllVehicles();
            string[] carsList = new string[allCars.Length];

            foreach (Vehicle car in allCars) {
                if (car.Exists()) {
                    string driver = car.Driver.Exists() ? Functions.GetPersonaForPed(car.Driver).FullName : "";
                    carsList[Array.IndexOf(allCars, car)] = $"licensePlate={car.LicensePlate}&model={car.Model.Name}&isStolen={car.IsStolen}&isPolice={car.IsPoliceVehicle}&owner={Functions.GetVehicleOwnerName(car)}&driver={driver}&registration={getRegistration(car)}&insurance={getInsurance(car)}";
                }
            }

            File.WriteAllText("EPC/data/worldCars.data", string.Join(",", carsList));
        }

        private static void updateWorldCars() {
            Game.LogTrivial("ExternalPoliceComputer: Update worldCars.data");

            try {
                updateWorldCarsWithSTP();
            } catch {
                Vehicle[] allCars = World.GetAllVehicles();
                string[] carsList = new string[allCars.Length];

                foreach (Vehicle car in allCars) {
                    if (car.Exists()) {
                        string driver = car.Driver.Exists() ? Functions.GetPersonaForPed(car.Driver).FullName : "";
                        carsList[Array.IndexOf(allCars, car)] = $"licensePlate={car.LicensePlate}&model={car.Model.Name}&isStolen={car.IsStolen}&isPolice={car.IsPoliceVehicle}&owner={Functions.GetVehicleOwnerName(car)}&driver={driver}";
                    }
                }

                File.WriteAllText("EPC/data/worldCars.data", string.Join(",", carsList));
            }
            
            Game.LogTrivial("ExternalPoliceComputer: Updated worldCars.data");
        }

        private static void updateCurrentID(Ped ped) {
            Game.LogTrivial("ExternalPoliceComputer: Update currentID.data");

            int pedHeadShot = NativeFunction.Natives.REGISTER_PEDHEADSHOT<int>(ped);
            while (!NativeFunction.Natives.IS_PEDHEADSHOT_READY<bool>(pedHeadShot)) {
                //Wait until Headshot is ready
                GameFiber.Yield();
            }
            string pedHeadShotString = NativeFunction.Natives.GET_PEDHEADSHOT_TXD_STRING<string>(pedHeadShot);

            string data = $"{Functions.GetPersonaForPed(ped).FullName},{Functions.GetPersonaForPed(ped).Birthday.Month}/{Functions.GetPersonaForPed(ped).Birthday.Day}/{Functions.GetPersonaForPed(ped).Birthday.Year},{Functions.GetPersonaForPed(ped).Gender},{pedHeadShotString}";

            File.WriteAllText("EPC/data/currentID.data", data);

            //Unload Headshot
            NativeFunction.Natives.UNREGISTER_PEDHEADSHOT(pedHeadShot);

            Game.LogTrivial("ExternalPoliceComputer: Updated currentID.data");
        }
    }
}