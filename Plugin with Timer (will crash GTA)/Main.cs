using Rage;
using LSPD_First_Response.Mod.API;
using System.IO;
using LSPD_First_Response.Engine.Scripting.Entities;
using System.Timers;
using System;

namespace ExternalPoliceComputer {
    public class Main : Plugin {
        public override void Initialize() {
            Functions.OnOnDutyStateChanged += Functions_OnOnDutyStateChanged;
            Game.LogTrivial("Plugin ExternalPoliceComputer has been initialized.");
        }

        public override void Finally() {
            Game.LogTrivial("ExternalPoliceComputer has been cleaned up.");
        }

        private static Timer timerPeds;
        private static Timer tempTimerCars;
        private static Timer timerCars;

        private static void Functions_OnOnDutyStateChanged(bool OnDuty) {
            if (OnDuty) {

                timerPeds = new Timer();
                timerPeds.Interval = 60000;
                timerPeds.Elapsed += TimerPeds_Elapsed;
                timerPeds.Enabled = true;

                timerCars = new Timer();
                timerCars.Interval = 60000;
                timerCars.Elapsed += TimerCars_Elapsed;

                tempTimerCars = new Timer();
                tempTimerCars.Interval = 30000;
                tempTimerCars.Elapsed += TempTimerCars_Elapsed;
                tempTimerCars.Enabled = true;


                Game.DisplayNotification("ExternalPoliceComputer has been loaded.");
            }
        }

        private static void TimerCars_Elapsed(object sender, ElapsedEventArgs e) {
            updateWorldCars();
        }

        private static void TempTimerCars_Elapsed(object sender, ElapsedEventArgs e) {
            tempTimerCars.Enabled = false;
            timerCars.Enabled = true;
        }

        private static void TimerPeds_Elapsed(object sender, ElapsedEventArgs e) {
            updateWorldPeds();
        }

       
        private static void updateWorldPeds() {
            Game.LogTrivial("ExternalPoliceComputer: Update EPC/worldPeds.data");
            Ped[] allPeds = World.GetAllPeds();
            string[] persList = new string[allPeds.Length];
           
            foreach (Ped ped in allPeds) {
               if (ped.Exists()) {
                   persList[Array.IndexOf(allPeds, ped)] = $"name={Functions.GetPersonaForPed(ped).FullName}&birthday={Functions.GetPersonaForPed(ped).Birthday.Month}/{Functions.GetPersonaForPed(ped).Birthday.Day}/{Functions.GetPersonaForPed(ped).Birthday.Year}&gender={Functions.GetPersonaForPed(ped).Gender}&isWanted={Functions.GetPersonaForPed(ped).Wanted}&licenseStatus={Functions.GetPersonaForPed(ped).ELicenseState}";
               }

            }

            File.WriteAllText("EPC/worldPeds.data", string.Join(",", persList));

            Game.LogTrivial("ExternalPoliceComputer: Updated EPC/worldPeds.data");
        }


        private static void updateWorldCars() {
            Game.LogTrivial("ExternalPoliceComputer: Update EPC/worldCars.data");
            Vehicle[] allCars = World.GetAllVehicles();
            string[] carsList = new string[allCars.Length];
            string driver;
            
            foreach (Vehicle car in allCars) {
                if (car.Exists()) {
                    driver = car.Driver.Exists() ? Functions.GetPersonaForPed(car.Driver).FullName : "";
                    carsList[Array.IndexOf(allCars, car)] = $"licensePlate={car.LicensePlate}&model={car.Model.Name}&isStolen={car.IsStolen}&isPolice={car.IsPoliceVehicle}&driver={driver}";
                }
            }
            
            File.WriteAllText("EPC/worldCars.data", string.Join(",", carsList));

            Game.LogTrivial("ExternalPoliceComputer: Updated EPC/worldCars.data");
        }

    }
}