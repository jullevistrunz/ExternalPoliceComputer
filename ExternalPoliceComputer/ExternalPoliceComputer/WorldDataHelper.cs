using CommonDataFramework.Modules.PedDatabase;
using CommonDataFramework.Modules.VehicleDatabase;
using Rage;

namespace ExternalPoliceComputer
{
    internal static class WorldDataHelper {
         internal static string GetWorldPedData(Ped ped) {
            PedData pedData = ped.GetPedData();
            if (pedData == null) return null;
            string birthday = $"{pedData.Birthday.Month}/{pedData.Birthday.Day}/{pedData.Birthday.Year}";
            return PrintObjects(
                ("name", pedData.FullName),
                ("birthday", birthday),
                ("gender", pedData.Gender.ToString()),
                ("isWanted", pedData.Wanted.ToString()),
                ("licenseStatus", pedData.DriversLicenseState.ToString()),
                ("licenseExpiration", pedData.DriversLicenseExpiration?.ToLocalTime().ToString("s") ?? ""),
                ("relationshipGroup", ped.RelationshipGroup.Name),
                ("isOnProbation", pedData.IsOnProbation.ToString()),
                ("isOnParole", pedData.IsOnParole.ToString()),
                ("weaponPermitPermitType", pedData.WeaponPermit.PermitType.ToString()),
                ("weaponPermitStatus", pedData.WeaponPermit.Status.ToString()),
                ("weaponPermitExpirationDate", pedData.WeaponPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("fishingPermitStatus", pedData.FishingPermit.Status.ToString()),
                ("fishingPermitExpirationDate", pedData.FishingPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("huntingPermitStatus", pedData.HuntingPermit.Status.ToString()),
                ("huntingPermitExpirationDate", pedData.HuntingPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("addressPostal", pedData.Address.AddressPostal.Number),
                ("addressStreet", pedData.Address.StreetName)
                );
         }

        internal static string GetWorldCarData(Vehicle car) {
            string driver = car.Driver.Exists() && car.Driver.IsHuman ? car.Driver.GetPedData().FullName : "";
            string color = Rage.Native.NativeFunction.Natives.GET_VEHICLE_LIVERY<int>(car) != -1 ? "" : $"{car.PrimaryColor.R}-{car.PrimaryColor.G}-{car.PrimaryColor.B}";

            DataToClient.AddWorldPed(car.GetVehicleData().Owner.Holder);

            return PrintObjects(
                ("licensePlate", car.LicensePlate),
                ("model", car.Model.Name),
                ("isStolen", car.GetVehicleData().IsStolen.ToString()),
                ("isPolice", car.IsPoliceVehicle.ToString()),
                ("owner", car.GetVehicleData().Owner.FullName),
                ("driver", driver),
                ("registration", car.GetVehicleData().Registration.Status.ToString()),
                ("insurance", car.GetVehicleData().Insurance.Status.ToString()),
                ("color", color)
                );
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