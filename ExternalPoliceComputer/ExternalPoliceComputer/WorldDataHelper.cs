using CommonDataFramework.Modules;
using CommonDataFramework.Modules.PedDatabase;
using CommonDataFramework.Modules.VehicleDatabase;
using Rage;

namespace ExternalPoliceComputer
{
    internal static class WorldDataHelper
    {
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

        internal static string GetWorldPedData(Ped ped) {
            PedData pedData = ped.GetPedData();
            if (pedData == null) return null;
            string birthday = $"{pedData.Birthday.Month}/{pedData.Birthday.Day}/{pedData.Birthday.Year}";
            return DataToClient.PrintObjects(
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
                ("huntingPermitExpirationDate", pedData.HuntingPermit.ExpirationDate.ToLocalTime().ToString("s")),
                ("addressPostal", pedData.Address.AddressPostal.Number),
                ("addressStreet", pedData.Address.StreetName)
                );
        }

        internal static string GetWorldCarData(Vehicle car) {
            string driver = car.Driver.Exists() ? LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(car.Driver).FullName : "";
            string color = Rage.Native.NativeFunction.Natives.GET_VEHICLE_LIVERY<int>(car) != -1 ? "" : $"{car.PrimaryColor.R}-{car.PrimaryColor.G}-{car.PrimaryColor.B}";

            DataToClient.AddWorldPedWithPedData(VehicleDataController.GetVehicleData(car).Owner);

            return DataToClient.PrintObjects(
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
    }
}