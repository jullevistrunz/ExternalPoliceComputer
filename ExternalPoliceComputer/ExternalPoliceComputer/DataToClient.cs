using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using CommonDataFramework.Modules.PedDatabase;
using LSPD_First_Response.Engine.Scripting.Entities;
using Rage;

namespace ExternalPoliceComputer
{
    internal static class DataToClient
    {       
         internal static void AddWorldCar(Vehicle car) {
            if (car.Exists()) {
                string data = WorldDataHelper.GetWorldCarData(car);
                string oldFile = File.ReadAllText($"{Main.DataPath}/worldCars.data");
                if (oldFile.Contains(car.LicensePlate)) return;

                string addComma = oldFile.Length > 0 ? "," : "";

                File.WriteAllText($"{Main.DataPath}/worldCars.data", $"{oldFile}{addComma}{data}");
            }
         }
         
        internal static void AddWorldPed(Ped ped) {
            if (ped.Exists() && ped.IsHuman) {
                string data = WorldDataHelper.GetWorldPedData(ped);
                string oldFile = File.ReadAllText($"{Main.DataPath}/worldPeds.data");
                if (oldFile.Contains(ped.GetPedData().FullName)) return;

                string addComma = oldFile.Length > 0 ? "," : "";

                File.WriteAllText($"{Main.DataPath}/worldPeds.data", $"{oldFile}{addComma}{data}");
            } 
        }
               
        internal static void UpdateWorldPeds() {
            if (!Main.Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldPeds.data; Invalid Player");
                return;
            }
            Ped[] allPeds = Main.Player.GetNearbyPeds(Main.MaxNumberOfNearbyPedsOrVehicles);
            string[] persList = new string[allPeds.Length];

            for (int i = 0; i < allPeds.Length; i++) {
                Ped ped = allPeds[i];
                if (ped.Exists() && ped.IsHuman) {
                    persList[i] = WorldDataHelper.GetWorldPedData(ped);
                }
            }

            persList = persList.Where(x => !string.IsNullOrEmpty(x)).ToArray();

            File.WriteAllText($"{Main.DataPath}/worldPeds.data", string.Join(",", persList));
        }

        internal static void UpdateWorldCars() {
            if (!Main.Player.Exists()) {
                Game.LogTrivial("ExternalPoliceComputer: Failed to update worldCars.data; Invalid Player");
                return;
            }
            Vehicle[] allCars = Main.Player.GetNearbyVehicles(Main.MaxNumberOfNearbyPedsOrVehicles);
            string[] carsList = new string[allCars.Length];

            for (int i = 0; i < allCars.Length; i++) {
                Vehicle car = allCars[i];
                if (car.Exists()) {
                    carsList[i] = WorldDataHelper.GetWorldCarData(car);
                }
            }

            carsList = carsList.Where(x => !string.IsNullOrEmpty(x)).ToArray();

            File.WriteAllText($"{Main.DataPath}/worldCars.data", string.Join(",", carsList));
        }

        internal static void UpdateCurrentID(Ped ped) {
            int index = 0;
            if (ped.IsInAnyVehicle(false)) {
                index = ped.SeatIndex + 2;
            }

            string oldFile = File.ReadAllText($"{Main.DataPath}/currentID.data");

            Persona persona = LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(ped);

            if (oldFile.Contains(persona.FullName)) return;

            string birthday = $"{persona.Birthday.Month}/{persona.Birthday.Day}/{persona.Birthday.Year}";

            string data = $"{persona.FullName},{birthday},{persona.Gender},{index};";

            File.WriteAllText($"{Main.DataPath}/currentID.data", File.ReadAllText($"{Main.DataPath}/currentID.data") + data);
        }

        internal static void UpdateCalloutData(string key, string value) {
            NameValueCollection calloutData = HttpUtility.ParseQueryString(File.ReadAllText($"{Main.DataPath}/callout.data"));

            calloutData.Set(key, value);

            string[] calloutDataQueryArr = new string[calloutData.Count];
            for (int i = 0; i < calloutData.Count; i++) {
                calloutDataQueryArr[i] = $"{calloutData.GetKey(i)}={calloutData.GetValues(i).FirstOrDefault()}";
            }

            File.WriteAllText($"{Main.DataPath}/callout.data", string.Join("&", calloutDataQueryArr));
        }

        // Thank you RoShit
        internal static string PrintObjects(params (string, string)[] items) {
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