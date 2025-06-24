using CommonDataFramework.Modules.VehicleDatabase;
using Rage;

namespace ExternalPoliceComputer.Data {
    public class EPCVehicleData {
        internal readonly Vehicle Holder;
        internal readonly VehicleData CDFVehicleData;

        public string LicensePlate;
        public string ModelName;
        public string ModelDisplayName;
        public bool IsStolen;
        public string Owner;
        public string Color;
        public string VehicleIdentificationNumber;
        public string RegistrationStatus;
        public string RegistrationExpiration;
        public string InsuranceStatus;
        public string InsuranceExpiration;

        internal EPCVehicleData(Vehicle vehicle) {
            Holder = vehicle;
            CDFVehicleData = vehicle.GetVehicleData();
            PopulateParameters();
        }
        internal EPCVehicleData(VehicleData vehicleData) {
            Holder = vehicleData.Holder;
            CDFVehicleData = vehicleData;
            PopulateParameters();
        }
        internal EPCVehicleData() { }

        private void PopulateParameters() {
            if (Holder == null || CDFVehicleData == null) return;

            LicensePlate = Holder.LicensePlate;
            ModelName = Holder.Model.Name;
            IsStolen = CDFVehicleData.IsStolen;
            Owner = CDFVehicleData.Owner.FullName.Trim();

            if (CDFVehicleData.Owner.FullName.Trim() != "Government") {
                DataController.AddCDFPedDataPedToDatabase(CDFVehicleData.Owner);
            }

            RegistrationStatus = CDFVehicleData.Registration.Status.ToString();
            RegistrationExpiration = CDFVehicleData.Registration.ExpirationDate?.ToString("s");
            InsuranceStatus = CDFVehicleData.Insurance.Status.ToString();
            InsuranceExpiration = CDFVehicleData.Insurance.ExpirationDate?.ToString("s");
            Color = Rage.Native.NativeFunction.Natives.GET_VEHICLE_LIVERY<int>(Holder) == -1 ? $"{Holder.PrimaryColor.R}-{Holder.PrimaryColor.G}-{Holder.PrimaryColor.B}" : null;
            VehicleIdentificationNumber = CDFVehicleData.Vin.Number;
            
            string unlocalizedModelDisplayName = Rage.Native.NativeFunction.Natives.GET_DISPLAY_NAME_FROM_VEHICLE_MODEL<string>(Holder.Model.Hash);

            ModelDisplayName = Rage.Native.NativeFunction.Natives.GET_FILENAME_FOR_AUDIO_CONVERSATION<string>(unlocalizedModelDisplayName);
        }
    }
}
