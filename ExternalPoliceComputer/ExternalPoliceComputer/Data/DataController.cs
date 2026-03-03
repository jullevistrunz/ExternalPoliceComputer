using CommonDataFramework.Modules;
using CommonDataFramework.Modules.PedDatabase;
using ExternalPoliceComputer.Data.Reports;
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
        private const string LifeIncarcerationValue = "LIFE";
        private const double RealDaysPerGameYear = 7d;
        private const double GameDaysPerYear = 365d;

        private static List<EPCPedData> pedDatabase = new List<EPCPedData>();
        public static IReadOnlyList<EPCPedData> PedDatabase { get { return GetPedDatabase(); } }

        private static List<EPCPedData> keepInPedDatabase = new List<EPCPedData>();

        private static List<EPCVehicleData> vehicleDatabase = new List<EPCVehicleData>();
        public static IReadOnlyList<EPCVehicleData> VehicleDatabase { get { return GetVehicleDatabase(); } }

        private static List<EPCVehicleData> keepInVehicleDatabase = new List<EPCVehicleData>();
        private static readonly Random random = new Random();
        private static readonly HashSet<PoolHandle> resolvedPedHandles = new HashSet<PoolHandle>();

        internal static List<CourtData> courtDatabase = new List<CourtData>();
        public static IReadOnlyList<CourtData> CourtDatabase => courtDatabase;

        internal static OfficerInformationData OfficerInformationData = new OfficerInformationData();
        internal static OfficerInformationData OfficerInformation = new OfficerInformationData();

        private static ShiftData currentShiftData = new ShiftData();
        internal static ShiftData CurrentShiftData => currentShiftData;

        internal static List<ShiftData> shiftHistoryData = new List<ShiftData>();
        public static IReadOnlyList<ShiftData> ShiftHistoryData => shiftHistoryData;

        internal static List<IncidentReport> incidentReports = new List<IncidentReport>();
        public static IReadOnlyList<IncidentReport> IncidentReports => incidentReports;

        internal static List<CitationReport> citationReports = new List<CitationReport>();
        public static IReadOnlyList<CitationReport> CitationReports => citationReports;

        internal static List<ArrestReport> arrestReports = new List<ArrestReport>();
        public static IReadOnlyList<ArrestReport> ArrestReports => arrestReports;

        internal static Location PlayerLocation = new Location();
        internal static string CurrentTime = World.TimeOfDay.ToString();

        internal static void SetDatabases() {
            SetPedDatabase();
            SetVehicleDatabase();
        }

        internal static void SetDynamicData() {
            UpdatePlayerLocation();
            CurrentTime = World.TimeOfDay.ToString();
        }

        private static void PopulatePedDatabase() {
            if (!Main.Player.Exists()) {
                Helper.Log("Failed to get nearby peds; Invalid player", true, Helper.LogSeverity.Error);
                return;
            }
            Ped[] nearbyPeds = Main.Player.GetNearbyPeds(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles);
            for (int i = 0; i < nearbyPeds.Length; i++) {
                ResolvePedForReEncounter(nearbyPeds[i]);
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
                if (epcVehicleData == null || epcVehicleData.LicensePlate == null) continue;
                if (vehicleDatabase.Any(x => x.LicensePlate == epcVehicleData.LicensePlate)) continue;
                vehicleDatabase.Add(epcVehicleData);
            }
        }

        private static void SetPedDatabase() {
            if (pedDatabase.Count > SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles * SetupController.GetConfig().databaseLimitMultiplier) {
                List<EPCPedData> keysToRemove = pedDatabase.Take(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles).ToList();
                foreach (EPCPedData key in keysToRemove) {
                    if (keepInPedDatabase.Any(x => x.Name == key.Name)) continue;
                    pedDatabase.Remove(key);
                }
            }
        }

        private static void SetVehicleDatabase() {
            if (vehicleDatabase.Count > SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles * SetupController.GetConfig().databaseLimitMultiplier) {
                List<EPCVehicleData> keysToRemove = vehicleDatabase.Take(SetupController.GetConfig().maxNumberOfNearbyPedsOrVehicles).ToList();
                foreach (EPCVehicleData key in keysToRemove) {
                    if (keepInVehicleDatabase.Any(x => x.LicensePlate == key.LicensePlate)) continue;
                    vehicleDatabase.Remove(key);
                }
            }
            PopulateVehicleDatabase();
        }

        private static List<EPCPedData> GetPedDatabase() {
            return pedDatabase;
        }

        private static List<EPCVehicleData> GetVehicleDatabase() {
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
            if (!keepInPedDatabase.Any(x => x.Name == pedData.Name)) keepInPedDatabase.Add(pedData);
            Database.SavePed(pedData);
        }

        internal static void LoadPedDatabaseFromFile() {
            pedDatabase.Clear();
            keepInPedDatabase.Clear();
            List<EPCPedData> fileContent = SetupController.GetEPCPedData();
            foreach (EPCPedData data in fileContent) {
                if (data == null || data.Name == null) continue;
                if (!keepInPedDatabase.Any(x => x.Name == data.Name)) keepInPedDatabase.Add(data);
                if (!pedDatabase.Any(x => x.Name == data.Name)) pedDatabase.Add(data);
            }
        }

        internal static List<EPCPedData> GetPedDataToSave() {
            return keepInPedDatabase;
        }

        public static void KeepVehicleInDatabase(EPCVehicleData vehicleData) {
            if (!keepInVehicleDatabase.Any(x => x.LicensePlate == vehicleData.LicensePlate)) keepInVehicleDatabase.Add(vehicleData);
            Database.SaveVehicle(vehicleData);

            EPCPedData pedData = pedDatabase.FirstOrDefault(x => x.Name == vehicleData.Owner);
            if (pedData == null) return;
            pedData.Name = vehicleData.Owner;
            KeepPedInDatabase(pedData);
        }

        internal static void LoadVehicleDatabaseFromFile() {
            vehicleDatabase.Clear();
            keepInVehicleDatabase.Clear();
            List<EPCVehicleData> fileContent = SetupController.GetEPCVehicleData();
            foreach (EPCVehicleData data in fileContent) {
                if (data == null || data.LicensePlate == null) continue;
                if (!keepInVehicleDatabase.Any(x => x.LicensePlate == data.LicensePlate)) keepInVehicleDatabase.Add(data);
                if (!vehicleDatabase.Any(x => x.LicensePlate == data.LicensePlate)) vehicleDatabase.Add(data);
            }
        }

        internal static List<EPCVehicleData> GetVehicleDataToSave() {
            return keepInVehicleDatabase;
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
            if (pedData == null) return;
            if (pedData.Holder != null && pedData.Holder.IsValid()) {
                ResolvePedForReEncounter(pedData.Holder);
                return;
            }

            EPCPedData epcPedData = new EPCPedData(pedData);
            if (epcPedData == null || epcPedData.Name == null) return;
            if (pedDatabase.Any(x => x.Name == epcPedData.Name)) return;
            TryApplyReEncounterProfile(epcPedData);
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
            if (currentShiftData.startTime == null) return;

            currentShiftData.endTime = SetupController.GetConfig().useInGameTime ? DateTime.ParseExact(World.TimeOfDay.ToString(), "HH:mm:ss", CultureInfo.InvariantCulture) : DateTime.Now;
            shiftHistoryData.Add(currentShiftData);
            Database.SaveShift(currentShiftData);
            currentShiftData = new ShiftData();
            ShiftHistoryUpdated?.Invoke();
        }

        internal static event Action ShiftHistoryUpdated;

        internal static void AddReportToCurrentShift(string reportId) {
            if (currentShiftData.startTime == null || currentShiftData.reports.Contains(reportId)) return;
            currentShiftData.reports.Add(reportId);
        }

        internal static void AddReport(Report report) {
            if (report is CitationReport citationReport) {
                if (!string.IsNullOrEmpty(citationReport.OffenderPedName)) {
                    int pedIndex = pedDatabase.FindIndex(pedData => pedData.Name.ToLower() == citationReport.OffenderPedName.ToLower());
                    if (pedIndex != -1) {
                        EPCPedData pedDataToAdd = pedDatabase[pedIndex];

                        pedDataToAdd.Citations.AddRange(citationReport.Charges.Where(x => !x.addedByReportInEdit));

                        KeepPedInDatabase(pedDataToAdd);
                        pedDatabase[pedIndex] = pedDataToAdd;
                    }
                }

                if (!string.IsNullOrEmpty(citationReport.OffenderVehicleLicensePlate)) {
                    EPCVehicleData vehicleDataToAdd = vehicleDatabase.FirstOrDefault(vehicleData => vehicleData.LicensePlate.ToLower() == citationReport.OffenderVehicleLicensePlate.ToLower());
                    if (vehicleDataToAdd != null) KeepVehicleInDatabase(vehicleDataToAdd);
                }

                string courtCaseNumber = citationReport.CourtCaseNumber ?? Helper.GetCourtCaseNumber();

                citationReport.CourtCaseNumber = courtCaseNumber;

                CourtData courtData = new CourtData(
                    citationReport.OffenderPedName,
                    courtCaseNumber,
                    citationReport.Id,
                    int.Parse(DateTime.Now.ToString("yy"))
                    );

                foreach (CitationReport.Charge charge in citationReport.Charges) {
                    courtData.AddCharge(
                        new CourtData.Charge(
                            charge.name,
                            Helper.GetRandomInt(charge.minFine, charge.maxFine),
                            0,
                            charge.isArrestable
                            )
                        );
                }

                if (!courtDatabase.Any(x => x.Number == courtCaseNumber)) {
                    if (courtDatabase.Count > SetupController.GetConfig().courtDatabaseMaxEntries) {
                        Database.DeleteCourtCase(courtDatabase[0].Number);
                        courtDatabase.RemoveAt(0);
                    }
                    courtDatabase.Add(courtData);
                }

                int index = citationReports.FindIndex(x => x.Id == citationReport.Id);
                if (index != -1) {
                    citationReports[index] = citationReport;
                } else {
                    citationReports.Add(citationReport);
                    if (Main.usePR) PRHelper.GiveCitation(courtData);
                }
            } else if (report is ArrestReport arrestReport) {
                if (!string.IsNullOrEmpty(arrestReport.OffenderPedName)) {
                    int pedIndex = pedDatabase.FindIndex(pedData => pedData.Name.ToLower() == arrestReport.OffenderPedName.ToLower());
                    if (pedIndex != -1) {
                        EPCPedData pedDataToAdd = pedDatabase[pedIndex];

                        pedDataToAdd.Arrests.AddRange(arrestReport.Charges.Where(x => !x.addedByReportInEdit));

                        KeepPedInDatabase(pedDataToAdd);
                        pedDatabase[pedIndex] = pedDataToAdd;
                    }
                }

                if (!string.IsNullOrEmpty(arrestReport.OffenderVehicleLicensePlate)) {
                    EPCVehicleData vehicleDataToAdd = vehicleDatabase.FirstOrDefault(vehicleData => vehicleData.LicensePlate.ToLower() == arrestReport.OffenderVehicleLicensePlate.ToLower());
                    if (vehicleDataToAdd != null) KeepVehicleInDatabase(vehicleDataToAdd);
                }

                string courtCaseNumber = arrestReport.CourtCaseNumber ?? Helper.GetCourtCaseNumber();

                arrestReport.CourtCaseNumber = courtCaseNumber;

                CourtData courtData = new CourtData(
                    arrestReport.OffenderPedName,
                    courtCaseNumber,
                    arrestReport.Id,
                    int.Parse(DateTime.Now.ToString("yy"))
                    );

                foreach (ArrestReport.Charge charge in arrestReport.Charges) {
                    int? time;
                    if (charge.maxDays == null) {
                        if (Helper.GetRandomInt(0, 1) == 0) {
                            time = Helper.GetRandomInt(charge.minDays, charge.minDays * 2);
                        } else {
                            time = null;
                        }
                    } else {
                        time = Helper.GetRandomInt(charge.minDays, (int)charge.maxDays);
                    }
                    courtData.AddCharge(
                        new CourtData.Charge(
                            charge.name,
                            Helper.GetRandomInt(charge.minFine, charge.maxFine),
                            time
                            )
                        );
                }

                if (!string.IsNullOrEmpty(arrestReport.OffenderPedName)) {
                    int pedIndex = pedDatabase.FindIndex(pedData => pedData.Name.ToLower() == arrestReport.OffenderPedName.ToLower());
                    if (pedIndex != -1) {
                        EPCPedData pedDataToUpdate = pedDatabase[pedIndex];
                        UpdatePedIncarcerationFromCourtData(pedDataToUpdate, courtData);
                        KeepPedInDatabase(pedDataToUpdate);
                        pedDatabase[pedIndex] = pedDataToUpdate;
                    }
                }

                if (!courtDatabase.Any(x => x.Number == courtCaseNumber)) {
                    if (courtDatabase.Count > SetupController.GetConfig().courtDatabaseMaxEntries) {
                        Database.DeleteCourtCase(courtDatabase[0].Number);
                        courtDatabase.RemoveAt(0);
                    }
                    courtDatabase.Add(courtData);
                }

                int index = arrestReports.FindIndex(x => x.Id == arrestReport.Id);
                if (index != -1) {
                    arrestReports[index] = arrestReport;
                } else {
                    arrestReports.Add(arrestReport);
                }
            } else if (report is IncidentReport incidentReport) {
                foreach (string offenderPedName in incidentReport.OffenderPedsNames) {
                    if (!string.IsNullOrEmpty(offenderPedName)) {
                        EPCPedData pedDataToAdd = pedDatabase.FirstOrDefault(pedData => pedData.Name.ToLower() == offenderPedName.ToLower());
                        if (pedDataToAdd != null) KeepPedInDatabase(pedDataToAdd);
                    }
                }

                foreach (string witnessPedName in incidentReport.WitnessPedsNames) {
                    if (!string.IsNullOrEmpty(witnessPedName)) {
                        EPCPedData pedDataToAdd = pedDatabase.FirstOrDefault(pedData => pedData.Name.ToLower() == witnessPedName.ToLower());
                        if (pedDataToAdd != null) KeepPedInDatabase(pedDataToAdd);
                    }
                }

                int index = incidentReports.FindIndex(x => x.Id == incidentReport.Id);
                if (index != -1) {
                    incidentReports[index] = incidentReport;
                } else {
                    incidentReports.Add(incidentReport);
                }
            }
            AddReportToCurrentShift(report.Id);
        }

        private static void TryApplyReEncounterProfile(EPCPedData currentPedData) {
            EPCPedData persistentMatch = GetReEncounterCandidate(currentPedData);
            if (persistentMatch == null) return;

            string originalName = currentPedData.Name;
            currentPedData.ApplyPersistentIdentity(persistentMatch);
            currentPedData.TimesStopped = Math.Max(currentPedData.TimesStopped, persistentMatch.TimesStopped + 1);

            if (currentPedData.CDFPedData != null) {
                currentPedData.CDFPedData.Wanted = currentPedData.IsWanted;
                currentPedData.CDFPedData.IsOnProbation = currentPedData.IsOnProbation;
                currentPedData.CDFPedData.IsOnParole = currentPedData.IsOnParole;
                currentPedData.CDFPedData.Citations = currentPedData.Citations?.Count ?? 0;
                currentPedData.CDFPedData.TimesStopped = currentPedData.TimesStopped;
            }

            KeepPedInDatabase(currentPedData);
            Helper.Log($"Re-encounter matched by model: {originalName} => {currentPedData.Name}", false, Helper.LogSeverity.Info);
        }

        internal static void ResolvePedForReEncounter(Ped ped) {
            if (ped == null || !ped.IsValid()) return;
            if (resolvedPedHandles.Contains(ped.Handle)) return;
            if (resolvedPedHandles.Count > 4000) resolvedPedHandles.Clear();
            resolvedPedHandles.Add(ped.Handle);

            EPCPedData epcPedData = new EPCPedData(ped);
            if (epcPedData == null || string.IsNullOrEmpty(epcPedData.Name)) return;
            if (pedDatabase.Any(x => x.Name == epcPedData.Name)) return;

            TryApplyReEncounterProfile(epcPedData);
            if (pedDatabase.Any(x => x.Name == epcPedData.Name)) return;

            pedDatabase.Add(epcPedData);
        }

        private static EPCPedData GetReEncounterCandidate(EPCPedData currentPedData) {
            if (currentPedData == null) return null;

            float chance = SetupController.GetConfig().reEncounterChance;
            if (chance <= 0f) return null;
            if (chance >= 1f) chance = 1f;
            if (random.NextDouble() > chance) return null;

            List<EPCPedData> candidates = keepInPedDatabase
                .Where(ped => ped != null && !string.IsNullOrEmpty(ped.Name))
                .Where(IsPedAvailableForEncounter)
                .Where(ped => !pedDatabase.Any(activePed => activePed.Name == ped.Name))
                .Where(ped => {
                    if (currentPedData.ModelHash != 0 && ped.ModelHash != 0) {
                        return ped.ModelHash == currentPedData.ModelHash;
                    }
                    if (!string.IsNullOrEmpty(currentPedData.ModelName) && !string.IsNullOrEmpty(ped.ModelName)) {
                        return ped.ModelName == currentPedData.ModelName;
                    }
                    return false;
                })
                .ToList();

            if (candidates.Count == 0) return null;
            return candidates[random.Next(candidates.Count)];
        }

        private static bool IsPedAvailableForEncounter(EPCPedData pedData) {
            if (pedData == null) return false;
            if (string.IsNullOrEmpty(pedData.IncarceratedUntil)) return true;
            if (string.Equals(pedData.IncarceratedUntil, LifeIncarcerationValue, StringComparison.OrdinalIgnoreCase)) return false;

            if (!DateTime.TryParse(
                pedData.IncarceratedUntil,
                null,
                DateTimeStyles.RoundtripKind,
                out DateTime incarceratedUntil)) {
                return true;
            }

            return incarceratedUntil <= DateTime.UtcNow;
        }

        private static void UpdatePedIncarcerationFromCourtData(EPCPedData pedData, CourtData courtData) {
            if (pedData == null || courtData?.Charges == null) return;

            int totalDays = 0;
            bool hasLifeSentence = false;

            foreach (CourtData.Charge charge in courtData.Charges) {
                if (charge.Time == null) {
                    hasLifeSentence = true;
                    continue;
                }
                if (charge.Time > 0) totalDays += charge.Time.Value;
            }

            if (hasLifeSentence) {
                pedData.IncarceratedUntil = LifeIncarcerationValue;
                return;
            }

            if (totalDays <= 0) return;

            DateTime baseDate = DateTime.UtcNow;
            if (string.Equals(pedData.IncarceratedUntil, LifeIncarcerationValue, StringComparison.OrdinalIgnoreCase)) return;
            if (DateTime.TryParse(
                pedData.IncarceratedUntil,
                null,
                DateTimeStyles.RoundtripKind,
                out DateTime existingEnd) && existingEnd > baseDate) {
                baseDate = existingEnd;
            }

            double scaledRealDays = totalDays * (RealDaysPerGameYear / GameDaysPerYear);
            pedData.IncarceratedUntil = baseDate.AddDays(scaledRealDays).ToString("o");
        }

        private static OfficerInformationData GetOfficerInformation() {
            LSPD_First_Response.Engine.Scripting.Entities.Persona persona = LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(Main.Player);

            OfficerInformationData result = new OfficerInformationData {
                agency = Helper.GetAgencyNameFromScriptName(LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName()) ?? LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName(),
                firstName = persona.Forename,
                lastName = persona.Surname,
                callSign = DependencyCheck.IsIPTCommonAvailable() ? Helper.GetCallSignFromIPTCommon() : null
            };

            return result;
        }

        internal static void SetOfficerInformation() {
            OfficerInformation = GetOfficerInformation();
        }

        private static void UpdatePlayerLocation() {
            if (!Main.Player.IsValid()) return;
            PlayerLocation = new Location(Main.Player.Position);
        }
    }
}
