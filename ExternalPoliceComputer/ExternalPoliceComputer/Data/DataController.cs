using CommonDataFramework.Modules;
using CommonDataFramework.Modules.PedDatabase;
using ExternalPoliceComputer.Setup;
using ExternalPoliceComputer.Utility;
using LSPD_First_Response.Engine.Scripting.Entities;
using Rage;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace ExternalPoliceComputer.Data {
    public class DataController {
        private static List<EPCPedData> pedDatabase = new List<EPCPedData>();
        public static IReadOnlyList<EPCPedData> PedDatabase { get { return GetPedDatabase(); } }

        private static List<EPCPedData> KeepInDatabase = new List<EPCPedData>();

        private static List<EPCVehicleData> vehicleDatabase = new List<EPCVehicleData>();
        public static IReadOnlyList<EPCVehicleData> VehicleDatabase { get { return GetVehicleDatabase(); } }

        internal static List<CourtData> courtDatabase = new List<CourtData>();
        public static IReadOnlyList<CourtData> CourtDatabase => courtDatabase;

        internal static OfficerInformationData officerInformationData = new OfficerInformationData();

        private static ShiftData currentShiftData = new ShiftData();
        internal static ShiftData CurrentShiftData => currentShiftData;

        internal static List<ShiftData> shiftHistoryData = new List<ShiftData>();
        public static IReadOnlyList<ShiftData> ShiftHistoryData => shiftHistoryData;

        private static void PopulatePedDatabase() {
            if (!Main.Player.Exists()) {
                Helper.Log("Failed to get nearby peds; Invalid player", true, Helper.LogSeverity.Error);
                return;
            }
            Ped[] nearbyPeds = Main.Player.GetNearbyPeds(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles);
            for (int i = 0; i < nearbyPeds.Length; i++) {
                EPCPedData epcPedData = new EPCPedData(nearbyPeds[i]);
                if (pedDatabase.Any(x => x.Name == epcPedData.Name)) continue;
                pedDatabase.Add(epcPedData);
            }
        }

        private static void PopulateVehicleDatabase() {
            if (!Main.Player.Exists()) {
                Helper.Log("Failed to get nearby vehicles; Invalid player", true, Helper.LogSeverity.Error);
                return;
            }
            Vehicle[] nearbyVehicles = Main.Player.GetNearbyVehicles(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles);
            for (int i = 0; i < nearbyVehicles.Length; i++) {
                EPCVehicleData epcVehicleData = new EPCVehicleData(nearbyVehicles[i]);
                if (vehicleDatabase.Any(x => x.LicensePlate == epcVehicleData.LicensePlate)) continue;
                vehicleDatabase.Add(epcVehicleData);
            }
        }

        private static List<EPCPedData> GetPedDatabase() {
            if (pedDatabase.Count > SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles * SetupController.GetConfig().databaseLimitMultiplier) {
                List<EPCPedData> keysToRemove = pedDatabase.Take(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles).ToList();
                foreach (EPCPedData key in keysToRemove) {
                    if (KeepInDatabase.Any(x => x.Name == key.Name)) continue;
                    pedDatabase.Remove(key);
                }
            }
            PopulatePedDatabase();
            return pedDatabase;
        }

        private static List<EPCVehicleData> GetVehicleDatabase() {
            if (vehicleDatabase.Count > SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles * SetupController.GetConfig().databaseLimitMultiplier) {
                List<EPCVehicleData> keysToRemove = vehicleDatabase.Take(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles).ToList();
                foreach (EPCVehicleData key in keysToRemove) {
                    vehicleDatabase.Remove(key);
                }
            }
            PopulateVehicleDatabase();
            return vehicleDatabase;
        }

        internal static void SyncPedDatabaseWithCDF() {
            foreach (EPCPedData databasePed in PedDatabase) {
                databasePed.CDFPedData.Wanted = databasePed.IsWanted;
                databasePed.CDFPedData.IsOnProbation = databasePed.IsOnProbation;
                databasePed.CDFPedData.IsOnParole = databasePed.IsOnParole;
                if (Enum.TryParse(databasePed.LicenseStatus, out ELicenseState licenseStatusValue)) {
                    databasePed.CDFPedData.DriversLicenseState = licenseStatusValue;
                }
            }
        }

        internal static void SyncVehicleDatabaseWithCDF() {
            foreach (EPCVehicleData databaseVehicle in VehicleDatabase) {
                databaseVehicle.CDFVehicleData.IsStolen = databaseVehicle.IsStolen;
                if (Enum.TryParse(databaseVehicle.RegistrationStatus, out EDocumentStatus registrationStatusValue)) {
                    databaseVehicle.CDFVehicleData.Registration.Status = registrationStatusValue;
                }
                if (Enum.TryParse(databaseVehicle.InsuranceStatus, out EDocumentStatus insuranceStatusValue)) {
                    databaseVehicle.CDFVehicleData.Insurance.Status = insuranceStatusValue;
                }
            }
        }

        public static void KeepPedInDatabase(EPCPedData pedData) {
            if (!KeepInDatabase.Any(x => x.Name == pedData.Name)) KeepInDatabase.Add(pedData);
        }

        internal static void LoadPedDatabaseFromFile() {
            pedDatabase.Clear();
            List<EPCPedData> fileContent = SetupController.GetEPCPedData();
            foreach (EPCPedData data in fileContent) {
                KeepPedInDatabase(data);
                if (pedDatabase.Any(x => x.Name == data.Name)) continue;
                pedDatabase.Add(data);
            }
        }

        internal static List<EPCPedData> GetPedDataToSave() {
            return KeepInDatabase;
        }

        internal static void UpdatePedData(EPCPedData pedData) {
            int index = pedDatabase.FindIndex(x => x.Name == pedData.Name);
            if (index == -1) {
                Helper.Log("Failed to update Ped database!", false, Helper.LogSeverity.Warning);
                return;
            }
            pedDatabase[index] = pedData;
        }

        internal static void AddCDFPedDataPedToDatabase(PedData pedData) {
            EPCPedData epcPedData = new EPCPedData(pedData);
            if (pedDatabase.Any(x => x.Name == epcPedData.Name)) return;
            pedDatabase.Add(epcPedData);
        }

        internal static void UpdateVehicleData(EPCVehicleData vehicleData) {
            int index = vehicleDatabase.FindIndex(x => x.LicensePlate == vehicleData.LicensePlate);
            if (index == -1) {
                Helper.Log("Failed to update Vehicle database!", false, Helper.LogSeverity.Warning);
                return;
            }
            vehicleDatabase[index] = vehicleData;
        }

        internal static void StartCurrentShift() {
            currentShiftData.startTime = SetupController.GetConfig().useInGameTime ? DateTime.ParseExact(World.TimeOfDay.ToString(), "HH:mm:ss", CultureInfo.InvariantCulture) : DateTime.Now;
        }

        internal static void EndCurrentShift() {
            currentShiftData.endTime = SetupController.GetConfig().useInGameTime ? DateTime.ParseExact(World.TimeOfDay.ToString(), "HH:mm:ss", CultureInfo.InvariantCulture) : DateTime.Now;
            shiftHistoryData.Add(currentShiftData);
            currentShiftData = new ShiftData();
        }

        internal static void AddReportToCurrentShift(string reportId) {
            currentShiftData.reports.Add(reportId);
        }
    }
}
