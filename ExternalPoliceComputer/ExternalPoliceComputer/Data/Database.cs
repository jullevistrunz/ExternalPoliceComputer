using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Setup;
using ExternalPoliceComputer.Utility;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Globalization;
using System.IO;
using System.Linq;

namespace ExternalPoliceComputer.Data {
    internal static class Database {
        internal static readonly string DatabasePath = $"{SetupController.DataPath}/epc.db";

        private static SQLiteConnection connection;
        private static readonly object dbLock = new object();

        private const int CurrentSchemaVersion = 4;

        internal static void Initialize() {
            lock (dbLock) {
                try {
                    string connectionString = $"Data Source={DatabasePath};Version=3;Journal Mode=WAL;Foreign Keys=True;";
                    connection = new SQLiteConnection(connectionString);
                    connection.Open();

                    CreateSchema();

                    int version = GetSchemaVersion();
                    if (version == 0) {
                        SetSchemaVersion(CurrentSchemaVersion);

                        if (HasLegacyJsonFiles()) {
                            MigrateFromJson();
                        }
                    } else if (version < CurrentSchemaVersion) {
                        MigrateSchema(version);
                    }
                } catch (Exception e) {
                    Helper.Log($"Database initialization failed: {e.Message}", true, Helper.LogSeverity.Error);
                    connection?.Dispose();
                    connection = null;
                    throw;
                }
            }

            Helper.Log($"Database initialized at {Path.GetFullPath(DatabasePath)}");
        }

        internal static void Close() {
            lock (dbLock) {
                connection?.Close();
                connection?.Dispose();
                connection = null;
            }
        }

        #region Schema

        private static void CreateSchema() {
            string sql = @"
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS peds (
                    Name                    TEXT PRIMARY KEY,
                    FirstName               TEXT,
                    LastName                TEXT,
                    ModelHash               INTEGER NOT NULL DEFAULT 0,
                    ModelName               TEXT,
                    Birthday                TEXT,
                    Gender                  TEXT,
                    Address                 TEXT,
                    IsInGang                INTEGER NOT NULL DEFAULT 0,
                    AdvisoryText            TEXT,
                    TimesStopped            INTEGER NOT NULL DEFAULT 0,
                    IsWanted                INTEGER NOT NULL DEFAULT 0,
                    WarrantText             TEXT,
                    IsOnProbation           INTEGER NOT NULL DEFAULT 0,
                    IsOnParole              INTEGER NOT NULL DEFAULT 0,
                    LicenseStatus           TEXT,
                    LicenseExpiration       TEXT,
                    WeaponPermitStatus      TEXT,
                    WeaponPermitExpiration  TEXT,
                    WeaponPermitType        TEXT,
                    FishingPermitStatus     TEXT,
                    FishingPermitExpiration TEXT,
                    HuntingPermitStatus     TEXT,
                    HuntingPermitExpiration TEXT,
                    IncarceratedUntil       TEXT
                );

                CREATE TABLE IF NOT EXISTS ped_citations (
                    Id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    PedName          TEXT NOT NULL REFERENCES peds(Name) ON DELETE CASCADE,
                    name             TEXT,
                    minFine          INTEGER NOT NULL DEFAULT 0,
                    maxFine          INTEGER NOT NULL DEFAULT 0,
                    canRevokeLicense INTEGER NOT NULL DEFAULT 0,
                    isArrestable     INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_ped_citations_ped ON ped_citations(PedName);

                CREATE TABLE IF NOT EXISTS ped_arrests (
                    Id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    PedName          TEXT NOT NULL REFERENCES peds(Name) ON DELETE CASCADE,
                    name             TEXT,
                    minFine          INTEGER NOT NULL DEFAULT 0,
                    maxFine          INTEGER NOT NULL DEFAULT 0,
                    canRevokeLicense INTEGER NOT NULL DEFAULT 0,
                    isArrestable     INTEGER NOT NULL DEFAULT 1,
                    minDays          INTEGER NOT NULL DEFAULT 0,
                    maxDays          INTEGER,
                    probation        REAL NOT NULL DEFAULT 0,
                    canBeWarrant     INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_ped_arrests_ped ON ped_arrests(PedName);

                CREATE TABLE IF NOT EXISTS vehicles (
                    LicensePlate                TEXT PRIMARY KEY,
                    ModelName                   TEXT,
                    ModelDisplayName            TEXT,
                    IsStolen                    INTEGER NOT NULL DEFAULT 0,
                    Owner                       TEXT,
                    Color                       TEXT,
                    VehicleIdentificationNumber TEXT,
                    RegistrationStatus          TEXT,
                    RegistrationExpiration      TEXT,
                    InsuranceStatus             TEXT,
                    InsuranceExpiration          TEXT,
                    BOLOs                       TEXT
                );

                CREATE TABLE IF NOT EXISTS court_cases (
                    Number    TEXT PRIMARY KEY,
                    PedName   TEXT,
                    ReportId  TEXT,
                    ShortYear INTEGER NOT NULL,
                    Status    INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_court_cases_ped ON court_cases(PedName);

                CREATE TABLE IF NOT EXISTS court_charges (
                    Id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    CaseNumber   TEXT NOT NULL REFERENCES court_cases(Number) ON DELETE CASCADE,
                    Name         TEXT,
                    Fine         INTEGER NOT NULL DEFAULT 0,
                    Time         INTEGER,
                    IsArrestable INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_court_charges_case ON court_charges(CaseNumber);

                CREATE TABLE IF NOT EXISTS officer_information (
                    Id          INTEGER PRIMARY KEY CHECK (Id = 1),
                    firstName   TEXT,
                    lastName    TEXT,
                    rank        TEXT,
                    callSign    TEXT,
                    agency      TEXT,
                    badgeNumber INTEGER
                );

                CREATE TABLE IF NOT EXISTS shifts (
                    Id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    startTime TEXT,
                    endTime   TEXT
                );

                CREATE TABLE IF NOT EXISTS shift_reports (
                    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    ShiftId  INTEGER NOT NULL REFERENCES shifts(Id) ON DELETE CASCADE,
                    ReportId TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_shift_reports_shift ON shift_reports(ShiftId);

                CREATE TABLE IF NOT EXISTS incident_reports (
                    Id                 TEXT PRIMARY KEY,
                    ShortYear          INTEGER NOT NULL,
                    OfficerFirstName   TEXT,
                    OfficerLastName    TEXT,
                    OfficerRank        TEXT,
                    OfficerCallSign    TEXT,
                    OfficerAgency      TEXT,
                    OfficerBadgeNumber INTEGER,
                    LocationArea       TEXT,
                    LocationStreet     TEXT,
                    LocationCounty     TEXT,
                    LocationPostal     TEXT,
                    TimeStamp          TEXT NOT NULL,
                    Status             INTEGER NOT NULL DEFAULT 1,
                    Notes              TEXT
                );

                CREATE TABLE IF NOT EXISTS incident_report_offenders (
                    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    ReportId TEXT NOT NULL REFERENCES incident_reports(Id) ON DELETE CASCADE,
                    PedName  TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_incident_offenders_report ON incident_report_offenders(ReportId);

                CREATE TABLE IF NOT EXISTS incident_report_witnesses (
                    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    ReportId TEXT NOT NULL REFERENCES incident_reports(Id) ON DELETE CASCADE,
                    PedName  TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_incident_witnesses_report ON incident_report_witnesses(ReportId);

                CREATE TABLE IF NOT EXISTS citation_reports (
                    Id                          TEXT PRIMARY KEY,
                    ShortYear                   INTEGER NOT NULL,
                    OfficerFirstName            TEXT,
                    OfficerLastName             TEXT,
                    OfficerRank                 TEXT,
                    OfficerCallSign             TEXT,
                    OfficerAgency               TEXT,
                    OfficerBadgeNumber          INTEGER,
                    LocationArea                TEXT,
                    LocationStreet              TEXT,
                    LocationCounty              TEXT,
                    LocationPostal              TEXT,
                    TimeStamp                   TEXT NOT NULL,
                    Status                      INTEGER NOT NULL DEFAULT 1,
                    Notes                       TEXT,
                    OffenderPedName             TEXT,
                    OffenderVehicleLicensePlate TEXT,
                    CourtCaseNumber             TEXT
                );

                CREATE TABLE IF NOT EXISTS citation_report_charges (
                    Id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                    ReportId            TEXT NOT NULL REFERENCES citation_reports(Id) ON DELETE CASCADE,
                    name                TEXT,
                    minFine             INTEGER NOT NULL DEFAULT 0,
                    maxFine             INTEGER NOT NULL DEFAULT 0,
                    canRevokeLicense    INTEGER NOT NULL DEFAULT 0,
                    isArrestable        INTEGER NOT NULL DEFAULT 0,
                    addedByReportInEdit INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_citation_charges_report ON citation_report_charges(ReportId);

                CREATE TABLE IF NOT EXISTS arrest_reports (
                    Id                          TEXT PRIMARY KEY,
                    ShortYear                   INTEGER NOT NULL,
                    OfficerFirstName            TEXT,
                    OfficerLastName             TEXT,
                    OfficerRank                 TEXT,
                    OfficerCallSign             TEXT,
                    OfficerAgency               TEXT,
                    OfficerBadgeNumber          INTEGER,
                    LocationArea                TEXT,
                    LocationStreet              TEXT,
                    LocationCounty              TEXT,
                    LocationPostal              TEXT,
                    TimeStamp                   TEXT NOT NULL,
                    Status                      INTEGER NOT NULL DEFAULT 1,
                    Notes                       TEXT,
                    OffenderPedName             TEXT,
                    OffenderVehicleLicensePlate TEXT,
                    CourtCaseNumber             TEXT
                );

                CREATE TABLE IF NOT EXISTS arrest_report_charges (
                    Id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                    ReportId            TEXT NOT NULL REFERENCES arrest_reports(Id) ON DELETE CASCADE,
                    name                TEXT,
                    minFine             INTEGER NOT NULL DEFAULT 0,
                    maxFine             INTEGER NOT NULL DEFAULT 0,
                    canRevokeLicense    INTEGER NOT NULL DEFAULT 0,
                    isArrestable        INTEGER NOT NULL DEFAULT 1,
                    minDays             INTEGER NOT NULL DEFAULT 0,
                    maxDays             INTEGER,
                    probation           REAL NOT NULL DEFAULT 0,
                    canBeWarrant        INTEGER NOT NULL DEFAULT 0,
                    addedByReportInEdit INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_arrest_charges_report ON arrest_report_charges(ReportId);

                CREATE TABLE IF NOT EXISTS search_history (
                    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    SearchType  TEXT NOT NULL,
                    SearchQuery TEXT NOT NULL,
                    ResultName  TEXT,
                    Timestamp   TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(SearchType);
                CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(Timestamp);
            ";

            using (var cmd = new SQLiteCommand(sql, connection)) {
                cmd.ExecuteNonQuery();
            }
        }

        private static int GetSchemaVersion() {
            using (var cmd = new SQLiteCommand("SELECT version FROM schema_version LIMIT 1", connection)) {
                object result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
        }

        private static void SetSchemaVersion(int version) {
            using (var cmd = new SQLiteCommand("DELETE FROM schema_version; INSERT INTO schema_version (version) VALUES (@v)", connection)) {
                cmd.Parameters.AddWithValue("@v", version);
                cmd.ExecuteNonQuery();
            }
        }

        private static void MigrateSchema(int fromVersion) {
            if (fromVersion < 2) {
                using (var cmd = new SQLiteCommand(@"
                    CREATE TABLE IF NOT EXISTS search_history (
                        Id          INTEGER PRIMARY KEY AUTOINCREMENT,
                        SearchType  TEXT NOT NULL,
                        SearchQuery TEXT NOT NULL,
                        ResultName  TEXT,
                        Timestamp   TEXT NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(SearchType);
                    CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(Timestamp);
                ", connection)) {
                    cmd.ExecuteNonQuery();
                }
                Helper.Log("Database migrated to schema version 2 (search_history table)");
            }

            if (fromVersion < 3) {
                using (var cmd = new SQLiteCommand(@"
                    ALTER TABLE court_cases ADD COLUMN Status INTEGER NOT NULL DEFAULT 0;
                ", connection)) {
                    cmd.ExecuteNonQuery();
                }
                Helper.Log("Database migrated to schema version 3 (court_cases Status column)");
            }

            if (fromVersion < 4) {
                using (var cmd = new SQLiteCommand(@"
                    ALTER TABLE peds ADD COLUMN ModelHash INTEGER NOT NULL DEFAULT 0;
                    ALTER TABLE peds ADD COLUMN ModelName TEXT;
                    ALTER TABLE peds ADD COLUMN IncarceratedUntil TEXT;
                ", connection)) {
                    cmd.ExecuteNonQuery();
                }
                Helper.Log("Database migrated to schema version 4 (ped model + incarceration columns)");
            }

            SetSchemaVersion(CurrentSchemaVersion);
        }

        #endregion

        #region Load Methods

        internal static List<EPCPedData> LoadPeds() {
            lock (dbLock) {
                if (connection == null) return null;

                var peds = new List<EPCPedData>();

                using (var cmd = new SQLiteCommand("SELECT * FROM peds", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            peds.Add(ReadPedFromRow(reader));
                        }
                    }
                }

                foreach (var ped in peds) {
                    ped.Citations = LoadPedCitations(ped.Name);
                    ped.Arrests = LoadPedArrests(ped.Name);
                }

                return peds;
            }
        }

        private static EPCPedData ReadPedFromRow(SQLiteDataReader reader) {
            return new EPCPedData {
                Name = reader["Name"] as string,
                FirstName = reader["FirstName"] as string,
                LastName = reader["LastName"] as string,
                ModelHash = reader["ModelHash"] is DBNull ? 0 : Convert.ToUInt32(reader["ModelHash"]),
                ModelName = reader["ModelName"] as string,
                Birthday = reader["Birthday"] as string,
                Gender = reader["Gender"] as string,
                Address = reader["Address"] as string,
                IsInGang = Convert.ToBoolean(reader["IsInGang"]),
                AdvisoryText = reader["AdvisoryText"] as string,
                TimesStopped = Convert.ToInt32(reader["TimesStopped"]),
                IsWanted = Convert.ToBoolean(reader["IsWanted"]),
                WarrantText = reader["WarrantText"] as string,
                IsOnProbation = Convert.ToBoolean(reader["IsOnProbation"]),
                IsOnParole = Convert.ToBoolean(reader["IsOnParole"]),
                LicenseStatus = reader["LicenseStatus"] as string,
                LicenseExpiration = reader["LicenseExpiration"] as string,
                WeaponPermitStatus = reader["WeaponPermitStatus"] as string,
                WeaponPermitExpiration = reader["WeaponPermitExpiration"] as string,
                WeaponPermitType = reader["WeaponPermitType"] as string,
                FishingPermitStatus = reader["FishingPermitStatus"] as string,
                FishingPermitExpiration = reader["FishingPermitExpiration"] as string,
                HuntingPermitStatus = reader["HuntingPermitStatus"] as string,
                HuntingPermitExpiration = reader["HuntingPermitExpiration"] as string,
                IncarceratedUntil = reader["IncarceratedUntil"] as string
            };
        }

        private static List<CitationGroup.Charge> LoadPedCitations(string pedName) {
            var charges = new List<CitationGroup.Charge>();

            using (var cmd = new SQLiteCommand("SELECT * FROM ped_citations WHERE PedName = @name", connection)) {
                cmd.Parameters.AddWithValue("@name", pedName);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        charges.Add(new CitationGroup.Charge {
                            name = reader["name"] as string,
                            minFine = Convert.ToInt32(reader["minFine"]),
                            maxFine = Convert.ToInt32(reader["maxFine"]),
                            canRevokeLicense = Convert.ToBoolean(reader["canRevokeLicense"]),
                            isArrestable = Convert.ToBoolean(reader["isArrestable"])
                        });
                    }
                }
            }

            return charges;
        }

        private static List<ArrestGroup.Charge> LoadPedArrests(string pedName) {
            var charges = new List<ArrestGroup.Charge>();

            using (var cmd = new SQLiteCommand("SELECT * FROM ped_arrests WHERE PedName = @name", connection)) {
                cmd.Parameters.AddWithValue("@name", pedName);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        charges.Add(new ArrestGroup.Charge {
                            name = reader["name"] as string,
                            minFine = Convert.ToInt32(reader["minFine"]),
                            maxFine = Convert.ToInt32(reader["maxFine"]),
                            canRevokeLicense = Convert.ToBoolean(reader["canRevokeLicense"]),
                            isArrestable = Convert.ToBoolean(reader["isArrestable"]),
                            minDays = Convert.ToInt32(reader["minDays"]),
                            maxDays = reader["maxDays"] is DBNull ? (int?)null : Convert.ToInt32(reader["maxDays"]),
                            probation = Convert.ToSingle(reader["probation"]),
                            canBeWarrant = Convert.ToBoolean(reader["canBeWarrant"])
                        });
                    }
                }
            }

            return charges;
        }

        internal static List<EPCVehicleData> LoadVehicles() {
            lock (dbLock) {
                if (connection == null) return null;

                var vehicles = new List<EPCVehicleData>();

                using (var cmd = new SQLiteCommand("SELECT * FROM vehicles", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            var vehicle = new EPCVehicleData {
                                LicensePlate = reader["LicensePlate"] as string,
                                ModelName = reader["ModelName"] as string,
                                ModelDisplayName = reader["ModelDisplayName"] as string,
                                IsStolen = Convert.ToBoolean(reader["IsStolen"]),
                                Owner = reader["Owner"] as string,
                                Color = reader["Color"] as string,
                                VehicleIdentificationNumber = reader["VehicleIdentificationNumber"] as string,
                                RegistrationStatus = reader["RegistrationStatus"] as string,
                                RegistrationExpiration = reader["RegistrationExpiration"] as string,
                                InsuranceStatus = reader["InsuranceStatus"] as string,
                                InsuranceExpiration = reader["InsuranceExpiration"] as string
                            };

                            string bolosJson = reader["BOLOs"] as string;
                            if (!string.IsNullOrEmpty(bolosJson)) {
                                try {
                                    vehicle.BOLOs = JsonConvert.DeserializeObject<CommonDataFramework.Modules.VehicleDatabase.VehicleBOLO[]>(bolosJson);
                                } catch {
                                    vehicle.BOLOs = null;
                                }
                            }

                            vehicles.Add(vehicle);
                        }
                    }
                }

                return vehicles;
            }
        }

        internal static List<CourtData> LoadCourtCases() {
            lock (dbLock) {
                if (connection == null) return null;

                var cases = new List<CourtData>();

                using (var cmd = new SQLiteCommand("SELECT * FROM court_cases", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            var courtCase = new CourtData {
                                Number = reader["Number"] as string,
                                PedName = reader["PedName"] as string,
                                ReportId = reader["ReportId"] as string,
                                ShortYear = Convert.ToInt32(reader["ShortYear"]),
                                Status = Convert.ToInt32(reader["Status"])
                            };

                            courtCase.Charges = LoadCourtCharges(courtCase.Number);
                            cases.Add(courtCase);
                        }
                    }
                }

                return cases;
            }
        }

        private static List<CourtData.Charge> LoadCourtCharges(string caseNumber) {
            var charges = new List<CourtData.Charge>();

            using (var cmd = new SQLiteCommand("SELECT * FROM court_charges WHERE CaseNumber = @num", connection)) {
                cmd.Parameters.AddWithValue("@num", caseNumber);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        charges.Add(new CourtData.Charge {
                            Name = reader["Name"] as string,
                            Fine = Convert.ToInt32(reader["Fine"]),
                            Time = reader["Time"] is DBNull ? (int?)null : Convert.ToInt32(reader["Time"]),
                            IsArrestable = reader["IsArrestable"] is DBNull ? (bool?)null : Convert.ToBoolean(reader["IsArrestable"])
                        });
                    }
                }
            }

            return charges;
        }

        internal static OfficerInformationData LoadOfficerInformation() {
            lock (dbLock) {
                if (connection == null) return null;

                using (var cmd = new SQLiteCommand("SELECT * FROM officer_information WHERE Id = 1", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        if (reader.Read()) {
                            return new OfficerInformationData {
                                firstName = reader["firstName"] as string,
                                lastName = reader["lastName"] as string,
                                rank = reader["rank"] as string,
                                callSign = reader["callSign"] as string,
                                agency = reader["agency"] as string,
                                badgeNumber = reader["badgeNumber"] is DBNull ? (int?)null : Convert.ToInt32(reader["badgeNumber"])
                            };
                        }
                    }
                }

                return null;
            }
        }

        internal static List<ShiftData> LoadShifts() {
            lock (dbLock) {
                if (connection == null) return null;

                var shifts = new List<ShiftData>();

                using (var cmd = new SQLiteCommand("SELECT * FROM shifts ORDER BY Id", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            int shiftId = Convert.ToInt32(reader["Id"]);

                            var shift = new ShiftData {
                                startTime = reader["startTime"] is DBNull ? (DateTime?)null : DateTime.Parse((string)reader["startTime"], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                                endTime = reader["endTime"] is DBNull ? (DateTime?)null : DateTime.Parse((string)reader["endTime"], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
                            };

                            shift.reports = LoadShiftReports(shiftId);
                            shifts.Add(shift);
                        }
                    }
                }

                return shifts;
            }
        }

        private static List<string> LoadShiftReports(int shiftId) {
            var reports = new List<string>();

            using (var cmd = new SQLiteCommand("SELECT ReportId FROM shift_reports WHERE ShiftId = @id", connection)) {
                cmd.Parameters.AddWithValue("@id", shiftId);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        reports.Add(reader["ReportId"] as string);
                    }
                }
            }

            return reports;
        }

        internal static List<IncidentReport> LoadIncidentReports() {
            lock (dbLock) {
                if (connection == null) return null;

                var reports = new List<IncidentReport>();

                using (var cmd = new SQLiteCommand("SELECT * FROM incident_reports", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            var report = new IncidentReport {
                                Id = reader["Id"] as string,
                                ShortYear = Convert.ToInt32(reader["ShortYear"]),
                                OfficerInformation = ReadOfficerFromRow(reader),
                                Location = ReadLocationFromRow(reader),
                                TimeStamp = DateTime.Parse((string)reader["TimeStamp"], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                                Status = (ReportStatus)Convert.ToInt32(reader["Status"]),
                                Notes = reader["Notes"] as string
                            };

                            report.OffenderPedsNames = LoadIncidentPedNames(report.Id, "incident_report_offenders");
                            report.WitnessPedsNames = LoadIncidentPedNames(report.Id, "incident_report_witnesses");
                            reports.Add(report);
                        }
                    }
                }

                return reports;
            }
        }

        private static string[] LoadIncidentPedNames(string reportId, string tableName) {
            var names = new List<string>();

            using (var cmd = new SQLiteCommand($"SELECT PedName FROM {tableName} WHERE ReportId = @id", connection)) {
                cmd.Parameters.AddWithValue("@id", reportId);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        names.Add(reader["PedName"] as string);
                    }
                }
            }

            return names.ToArray();
        }

        internal static List<CitationReport> LoadCitationReports() {
            lock (dbLock) {
                if (connection == null) return null;

                var reports = new List<CitationReport>();

                using (var cmd = new SQLiteCommand("SELECT * FROM citation_reports", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            var report = new CitationReport {
                                Id = reader["Id"] as string,
                                ShortYear = Convert.ToInt32(reader["ShortYear"]),
                                OfficerInformation = ReadOfficerFromRow(reader),
                                Location = ReadLocationFromRow(reader),
                                TimeStamp = DateTime.Parse((string)reader["TimeStamp"], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                                Status = (ReportStatus)Convert.ToInt32(reader["Status"]),
                                Notes = reader["Notes"] as string,
                                OffenderPedName = reader["OffenderPedName"] as string,
                                OffenderVehicleLicensePlate = reader["OffenderVehicleLicensePlate"] as string,
                                CourtCaseNumber = reader["CourtCaseNumber"] as string
                            };

                            report.Charges = LoadCitationReportCharges(report.Id);
                            reports.Add(report);
                        }
                    }
                }

                return reports;
            }
        }

        private static List<CitationReport.Charge> LoadCitationReportCharges(string reportId) {
            var charges = new List<CitationReport.Charge>();

            using (var cmd = new SQLiteCommand("SELECT * FROM citation_report_charges WHERE ReportId = @id", connection)) {
                cmd.Parameters.AddWithValue("@id", reportId);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        charges.Add(new CitationReport.Charge {
                            name = reader["name"] as string,
                            minFine = Convert.ToInt32(reader["minFine"]),
                            maxFine = Convert.ToInt32(reader["maxFine"]),
                            canRevokeLicense = Convert.ToBoolean(reader["canRevokeLicense"]),
                            isArrestable = Convert.ToBoolean(reader["isArrestable"]),
                            addedByReportInEdit = Convert.ToBoolean(reader["addedByReportInEdit"])
                        });
                    }
                }
            }

            return charges;
        }

        internal static List<ArrestReport> LoadArrestReports() {
            lock (dbLock) {
                if (connection == null) return null;

                var reports = new List<ArrestReport>();

                using (var cmd = new SQLiteCommand("SELECT * FROM arrest_reports", connection)) {
                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            var report = new ArrestReport {
                                Id = reader["Id"] as string,
                                ShortYear = Convert.ToInt32(reader["ShortYear"]),
                                OfficerInformation = ReadOfficerFromRow(reader),
                                Location = ReadLocationFromRow(reader),
                                TimeStamp = DateTime.Parse((string)reader["TimeStamp"], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                                Status = (ReportStatus)Convert.ToInt32(reader["Status"]),
                                Notes = reader["Notes"] as string,
                                OffenderPedName = reader["OffenderPedName"] as string,
                                OffenderVehicleLicensePlate = reader["OffenderVehicleLicensePlate"] as string,
                                CourtCaseNumber = reader["CourtCaseNumber"] as string
                            };

                            report.Charges = LoadArrestReportCharges(report.Id);
                            reports.Add(report);
                        }
                    }
                }

                return reports;
            }
        }

        private static List<ArrestReport.Charge> LoadArrestReportCharges(string reportId) {
            var charges = new List<ArrestReport.Charge>();

            using (var cmd = new SQLiteCommand("SELECT * FROM arrest_report_charges WHERE ReportId = @id", connection)) {
                cmd.Parameters.AddWithValue("@id", reportId);

                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        charges.Add(new ArrestReport.Charge {
                            name = reader["name"] as string,
                            minFine = Convert.ToInt32(reader["minFine"]),
                            maxFine = Convert.ToInt32(reader["maxFine"]),
                            canRevokeLicense = Convert.ToBoolean(reader["canRevokeLicense"]),
                            isArrestable = Convert.ToBoolean(reader["isArrestable"]),
                            minDays = Convert.ToInt32(reader["minDays"]),
                            maxDays = reader["maxDays"] is DBNull ? (int?)null : Convert.ToInt32(reader["maxDays"]),
                            probation = Convert.ToSingle(reader["probation"]),
                            canBeWarrant = Convert.ToBoolean(reader["canBeWarrant"]),
                            addedByReportInEdit = Convert.ToBoolean(reader["addedByReportInEdit"])
                        });
                    }
                }
            }

            return charges;
        }

        private static OfficerInformationData ReadOfficerFromRow(SQLiteDataReader reader) {
            return new OfficerInformationData {
                firstName = reader["OfficerFirstName"] as string,
                lastName = reader["OfficerLastName"] as string,
                rank = reader["OfficerRank"] as string,
                callSign = reader["OfficerCallSign"] as string,
                agency = reader["OfficerAgency"] as string,
                badgeNumber = reader["OfficerBadgeNumber"] is DBNull ? (int?)null : Convert.ToInt32(reader["OfficerBadgeNumber"])
            };
        }

        private static Location ReadLocationFromRow(SQLiteDataReader reader) {
            return new Location {
                Area = reader["LocationArea"] as string,
                Street = reader["LocationStreet"] as string,
                County = reader["LocationCounty"] as string,
                Postal = reader["LocationPostal"] as string
            };
        }

        #endregion

        #region Save Methods

        internal static void SavePed(EPCPedData ped) {
            if (ped?.Name == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    SavePedInternal(ped, transaction);
                    transaction.Commit();
                }
            }
        }

        internal static void SavePeds(List<EPCPedData> peds) {
            if (peds == null || peds.Count == 0) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    foreach (var ped in peds) {
                        if (ped?.Name == null) continue;
                        SavePedInternal(ped, transaction);
                    }
                    transaction.Commit();
                }
            }
        }

        private static void SavePedInternal(EPCPedData ped, SQLiteTransaction transaction) {
            using (var cmd = new SQLiteCommand(@"
                INSERT OR REPLACE INTO peds (
                    Name, FirstName, LastName, ModelHash, ModelName, Birthday, Gender, Address,
                    IsInGang, AdvisoryText, TimesStopped, IsWanted, WarrantText,
                    IsOnProbation, IsOnParole, LicenseStatus, LicenseExpiration,
                    WeaponPermitStatus, WeaponPermitExpiration, WeaponPermitType,
                    FishingPermitStatus, FishingPermitExpiration,
                    HuntingPermitStatus, HuntingPermitExpiration, IncarceratedUntil
                ) VALUES (
                    @Name, @FirstName, @LastName, @ModelHash, @ModelName, @Birthday, @Gender, @Address,
                    @IsInGang, @AdvisoryText, @TimesStopped, @IsWanted, @WarrantText,
                    @IsOnProbation, @IsOnParole, @LicenseStatus, @LicenseExpiration,
                    @WeaponPermitStatus, @WeaponPermitExpiration, @WeaponPermitType,
                    @FishingPermitStatus, @FishingPermitExpiration,
                    @HuntingPermitStatus, @HuntingPermitExpiration, @IncarceratedUntil
                )", connection, transaction)) {
                cmd.Parameters.AddWithValue("@Name", (object)ped.Name ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FirstName", (object)ped.FirstName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@LastName", (object)ped.LastName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelHash", ped.ModelHash);
                cmd.Parameters.AddWithValue("@ModelName", (object)ped.ModelName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Birthday", (object)ped.Birthday ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Gender", (object)ped.Gender ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Address", (object)ped.Address ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsInGang", ped.IsInGang ? 1 : 0);
                cmd.Parameters.AddWithValue("@AdvisoryText", (object)ped.AdvisoryText ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TimesStopped", ped.TimesStopped);
                cmd.Parameters.AddWithValue("@IsWanted", ped.IsWanted ? 1 : 0);
                cmd.Parameters.AddWithValue("@WarrantText", (object)ped.WarrantText ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsOnProbation", ped.IsOnProbation ? 1 : 0);
                cmd.Parameters.AddWithValue("@IsOnParole", ped.IsOnParole ? 1 : 0);
                cmd.Parameters.AddWithValue("@LicenseStatus", (object)ped.LicenseStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@LicenseExpiration", (object)ped.LicenseExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@WeaponPermitStatus", (object)ped.WeaponPermitStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@WeaponPermitExpiration", (object)ped.WeaponPermitExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@WeaponPermitType", (object)ped.WeaponPermitType ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FishingPermitStatus", (object)ped.FishingPermitStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FishingPermitExpiration", (object)ped.FishingPermitExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@HuntingPermitStatus", (object)ped.HuntingPermitStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@HuntingPermitExpiration", (object)ped.HuntingPermitExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IncarceratedUntil", (object)ped.IncarceratedUntil ?? DBNull.Value);
                cmd.ExecuteNonQuery();
            }

            using (var cmd = new SQLiteCommand("DELETE FROM ped_citations WHERE PedName = @name", connection, transaction)) {
                cmd.Parameters.AddWithValue("@name", ped.Name);
                cmd.ExecuteNonQuery();
            }

            if (ped.Citations != null) {
                foreach (var charge in ped.Citations) {
                    using (var cmd = new SQLiteCommand(@"
                        INSERT INTO ped_citations (PedName, name, minFine, maxFine, canRevokeLicense, isArrestable)
                        VALUES (@PedName, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable)",
                        connection, transaction)) {
                        cmd.Parameters.AddWithValue("@PedName", ped.Name);
                        cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                        cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                        cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                        cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                        cmd.ExecuteNonQuery();
                    }
                }
            }

            using (var cmd = new SQLiteCommand("DELETE FROM ped_arrests WHERE PedName = @name", connection, transaction)) {
                cmd.Parameters.AddWithValue("@name", ped.Name);
                cmd.ExecuteNonQuery();
            }

            if (ped.Arrests != null) {
                foreach (var charge in ped.Arrests) {
                    using (var cmd = new SQLiteCommand(@"
                        INSERT INTO ped_arrests (PedName, name, minFine, maxFine, canRevokeLicense, isArrestable, minDays, maxDays, probation, canBeWarrant)
                        VALUES (@PedName, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable, @minDays, @maxDays, @probation, @canBeWarrant)",
                        connection, transaction)) {
                        cmd.Parameters.AddWithValue("@PedName", ped.Name);
                        cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                        cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                        cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                        cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                        cmd.Parameters.AddWithValue("@minDays", charge.minDays);
                        cmd.Parameters.AddWithValue("@maxDays", charge.maxDays.HasValue ? (object)charge.maxDays.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@probation", charge.probation);
                        cmd.Parameters.AddWithValue("@canBeWarrant", charge.canBeWarrant ? 1 : 0);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
        }

        internal static void SaveVehicle(EPCVehicleData vehicle) {
            if (vehicle?.LicensePlate == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    SaveVehicleInternal(vehicle, transaction);
                    transaction.Commit();
                }
            }
        }

        internal static void SaveVehicles(List<EPCVehicleData> vehicles) {
            if (vehicles == null || vehicles.Count == 0) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    foreach (var vehicle in vehicles) {
                        if (vehicle?.LicensePlate == null) continue;
                        SaveVehicleInternal(vehicle, transaction);
                    }
                    transaction.Commit();
                }
            }
        }

        private static void SaveVehicleInternal(EPCVehicleData vehicle, SQLiteTransaction transaction) {
            string bolosJson = vehicle.BOLOs != null ? JsonConvert.SerializeObject(vehicle.BOLOs) : null;

            using (var cmd = new SQLiteCommand(@"
                INSERT OR REPLACE INTO vehicles (
                    LicensePlate, ModelName, ModelDisplayName, IsStolen, Owner, Color,
                    VehicleIdentificationNumber, RegistrationStatus, RegistrationExpiration,
                    InsuranceStatus, InsuranceExpiration, BOLOs
                ) VALUES (
                    @LicensePlate, @ModelName, @ModelDisplayName, @IsStolen, @Owner, @Color,
                    @VIN, @RegStatus, @RegExpiration, @InsStatus, @InsExpiration, @BOLOs
                )", connection, transaction)) {
                cmd.Parameters.AddWithValue("@LicensePlate", (object)vehicle.LicensePlate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelName", (object)vehicle.ModelName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelDisplayName", (object)vehicle.ModelDisplayName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsStolen", vehicle.IsStolen ? 1 : 0);
                cmd.Parameters.AddWithValue("@Owner", (object)vehicle.Owner ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Color", (object)vehicle.Color ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@VIN", (object)vehicle.VehicleIdentificationNumber ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RegStatus", (object)vehicle.RegistrationStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RegExpiration", (object)vehicle.RegistrationExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@InsStatus", (object)vehicle.InsuranceStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@InsExpiration", (object)vehicle.InsuranceExpiration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@BOLOs", (object)bolosJson ?? DBNull.Value);
                cmd.ExecuteNonQuery();
            }
        }

        internal static void SaveCourtCase(CourtData courtCase) {
            if (courtCase?.Number == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    SaveCourtCaseInternal(courtCase, transaction);
                    transaction.Commit();
                }
            }
        }

        private static void SaveCourtCaseInternal(CourtData courtCase, SQLiteTransaction transaction) {
            using (var cmd = new SQLiteCommand(@"
                INSERT OR REPLACE INTO court_cases (Number, PedName, ReportId, ShortYear, Status)
                VALUES (@Number, @PedName, @ReportId, @ShortYear, @Status)",
                connection, transaction)) {
                cmd.Parameters.AddWithValue("@Number", (object)courtCase.Number ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PedName", (object)courtCase.PedName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ReportId", (object)courtCase.ReportId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ShortYear", courtCase.ShortYear);
                cmd.Parameters.AddWithValue("@Status", courtCase.Status);
                cmd.ExecuteNonQuery();
            }

            using (var cmd = new SQLiteCommand("DELETE FROM court_charges WHERE CaseNumber = @num", connection, transaction)) {
                cmd.Parameters.AddWithValue("@num", courtCase.Number);
                cmd.ExecuteNonQuery();
            }

            if (courtCase.Charges != null) {
                foreach (var charge in courtCase.Charges) {
                    using (var cmd = new SQLiteCommand(@"
                        INSERT INTO court_charges (CaseNumber, Name, Fine, Time, IsArrestable)
                        VALUES (@CaseNumber, @Name, @Fine, @Time, @IsArrestable)",
                        connection, transaction)) {
                        cmd.Parameters.AddWithValue("@CaseNumber", courtCase.Number);
                        cmd.Parameters.AddWithValue("@Name", (object)charge.Name ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Fine", charge.Fine);
                        cmd.Parameters.AddWithValue("@Time", charge.Time.HasValue ? (object)charge.Time.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@IsArrestable", charge.IsArrestable.HasValue ? (object)(charge.IsArrestable.Value ? 1 : 0) : DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
        }

        internal static void DeleteCourtCase(string caseNumber) {
            if (string.IsNullOrEmpty(caseNumber)) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var cmd = new SQLiteCommand("DELETE FROM court_cases WHERE Number = @num", connection)) {
                    cmd.Parameters.AddWithValue("@num", caseNumber);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        internal static void SaveOfficerInformation(OfficerInformationData data) {
            if (data == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var cmd = new SQLiteCommand(@"
                    INSERT OR REPLACE INTO officer_information (Id, firstName, lastName, rank, callSign, agency, badgeNumber)
                    VALUES (1, @firstName, @lastName, @rank, @callSign, @agency, @badgeNumber)",
                    connection)) {
                    cmd.Parameters.AddWithValue("@firstName", (object)data.firstName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@lastName", (object)data.lastName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@rank", (object)data.rank ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@callSign", (object)data.callSign ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@agency", (object)data.agency ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@badgeNumber", data.badgeNumber.HasValue ? (object)data.badgeNumber.Value : DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        internal static void SaveShift(ShiftData shift) {
            if (shift == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    SaveShiftInternal(shift, transaction);
                    transaction.Commit();
                }
            }
        }

        internal static void SaveShifts(List<ShiftData> shifts) {
            if (shifts == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    using (var cmd = new SQLiteCommand("DELETE FROM shifts", connection, transaction)) {
                        cmd.ExecuteNonQuery();
                    }

                    foreach (var shift in shifts) {
                        if (shift == null) continue;
                        SaveShiftInternal(shift, transaction);
                    }
                    transaction.Commit();
                }
            }
        }

        private static void SaveShiftInternal(ShiftData shift, SQLiteTransaction transaction) {
            using (var cmd = new SQLiteCommand(@"
                INSERT INTO shifts (startTime, endTime)
                VALUES (@startTime, @endTime);
                SELECT last_insert_rowid();",
                connection, transaction)) {
                cmd.Parameters.AddWithValue("@startTime", shift.startTime.HasValue ? (object)shift.startTime.Value.ToString("o") : DBNull.Value);
                cmd.Parameters.AddWithValue("@endTime", shift.endTime.HasValue ? (object)shift.endTime.Value.ToString("o") : DBNull.Value);
                long shiftId = (long)cmd.ExecuteScalar();

                if (shift.reports != null) {
                    foreach (string reportId in shift.reports) {
                        using (var rptCmd = new SQLiteCommand(@"
                            INSERT INTO shift_reports (ShiftId, ReportId) VALUES (@shiftId, @reportId)",
                            connection, transaction)) {
                            rptCmd.Parameters.AddWithValue("@shiftId", shiftId);
                            rptCmd.Parameters.AddWithValue("@reportId", reportId);
                            rptCmd.ExecuteNonQuery();
                        }
                    }
                }
            }
        }

        internal static void SaveIncidentReport(IncidentReport report) {
            if (report?.Id == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    WriteReportBase("incident_reports", report, transaction);

                    using (var cmd = new SQLiteCommand("DELETE FROM incident_report_offenders WHERE ReportId = @id", connection, transaction)) {
                        cmd.Parameters.AddWithValue("@id", report.Id);
                        cmd.ExecuteNonQuery();
                    }

                    if (report.OffenderPedsNames != null) {
                        foreach (string name in report.OffenderPedsNames) {
                            if (string.IsNullOrEmpty(name)) continue;
                            using (var cmd = new SQLiteCommand("INSERT INTO incident_report_offenders (ReportId, PedName) VALUES (@id, @name)", connection, transaction)) {
                                cmd.Parameters.AddWithValue("@id", report.Id);
                                cmd.Parameters.AddWithValue("@name", name);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    using (var cmd = new SQLiteCommand("DELETE FROM incident_report_witnesses WHERE ReportId = @id", connection, transaction)) {
                        cmd.Parameters.AddWithValue("@id", report.Id);
                        cmd.ExecuteNonQuery();
                    }

                    if (report.WitnessPedsNames != null) {
                        foreach (string name in report.WitnessPedsNames) {
                            if (string.IsNullOrEmpty(name)) continue;
                            using (var cmd = new SQLiteCommand("INSERT INTO incident_report_witnesses (ReportId, PedName) VALUES (@id, @name)", connection, transaction)) {
                                cmd.Parameters.AddWithValue("@id", report.Id);
                                cmd.Parameters.AddWithValue("@name", name);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    transaction.Commit();
                }
            }
        }

        internal static void SaveCitationReport(CitationReport report) {
            if (report?.Id == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    using (var cmd = new SQLiteCommand(@"
                        INSERT OR REPLACE INTO citation_reports (
                            Id, ShortYear, OfficerFirstName, OfficerLastName, OfficerRank,
                            OfficerCallSign, OfficerAgency, OfficerBadgeNumber,
                            LocationArea, LocationStreet, LocationCounty, LocationPostal,
                            TimeStamp, Status, Notes, OffenderPedName,
                            OffenderVehicleLicensePlate, CourtCaseNumber
                        ) VALUES (
                            @Id, @ShortYear, @OfficerFirstName, @OfficerLastName, @OfficerRank,
                            @OfficerCallSign, @OfficerAgency, @OfficerBadgeNumber,
                            @LocationArea, @LocationStreet, @LocationCounty, @LocationPostal,
                            @TimeStamp, @Status, @Notes, @OffenderPedName,
                            @OffenderVehicleLicensePlate, @CourtCaseNumber
                        )", connection, transaction)) {
                        AddReportBaseParams(cmd, report);
                        cmd.Parameters.AddWithValue("@OffenderPedName", (object)report.OffenderPedName ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@OffenderVehicleLicensePlate", (object)report.OffenderVehicleLicensePlate ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@CourtCaseNumber", (object)report.CourtCaseNumber ?? DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }

                    using (var cmd = new SQLiteCommand("DELETE FROM citation_report_charges WHERE ReportId = @id", connection, transaction)) {
                        cmd.Parameters.AddWithValue("@id", report.Id);
                        cmd.ExecuteNonQuery();
                    }

                    if (report.Charges != null) {
                        foreach (var charge in report.Charges) {
                            using (var cmd = new SQLiteCommand(@"
                                INSERT INTO citation_report_charges (ReportId, name, minFine, maxFine, canRevokeLicense, isArrestable, addedByReportInEdit)
                                VALUES (@ReportId, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable, @addedByReportInEdit)",
                                connection, transaction)) {
                                cmd.Parameters.AddWithValue("@ReportId", report.Id);
                                cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                                cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                                cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                                cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                                cmd.Parameters.AddWithValue("@addedByReportInEdit", charge.addedByReportInEdit ? 1 : 0);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    transaction.Commit();
                }
            }
        }

        internal static void SaveArrestReport(ArrestReport report) {
            if (report?.Id == null) return;

            lock (dbLock) {
                if (connection == null) return;

                using (var transaction = connection.BeginTransaction()) {
                    using (var cmd = new SQLiteCommand(@"
                        INSERT OR REPLACE INTO arrest_reports (
                            Id, ShortYear, OfficerFirstName, OfficerLastName, OfficerRank,
                            OfficerCallSign, OfficerAgency, OfficerBadgeNumber,
                            LocationArea, LocationStreet, LocationCounty, LocationPostal,
                            TimeStamp, Status, Notes, OffenderPedName,
                            OffenderVehicleLicensePlate, CourtCaseNumber
                        ) VALUES (
                            @Id, @ShortYear, @OfficerFirstName, @OfficerLastName, @OfficerRank,
                            @OfficerCallSign, @OfficerAgency, @OfficerBadgeNumber,
                            @LocationArea, @LocationStreet, @LocationCounty, @LocationPostal,
                            @TimeStamp, @Status, @Notes, @OffenderPedName,
                            @OffenderVehicleLicensePlate, @CourtCaseNumber
                        )", connection, transaction)) {
                        AddReportBaseParams(cmd, report);
                        cmd.Parameters.AddWithValue("@OffenderPedName", (object)report.OffenderPedName ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@OffenderVehicleLicensePlate", (object)report.OffenderVehicleLicensePlate ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@CourtCaseNumber", (object)report.CourtCaseNumber ?? DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }

                    using (var cmd = new SQLiteCommand("DELETE FROM arrest_report_charges WHERE ReportId = @id", connection, transaction)) {
                        cmd.Parameters.AddWithValue("@id", report.Id);
                        cmd.ExecuteNonQuery();
                    }

                    if (report.Charges != null) {
                        foreach (var charge in report.Charges) {
                            using (var cmd = new SQLiteCommand(@"
                                INSERT INTO arrest_report_charges (
                                    ReportId, name, minFine, maxFine, canRevokeLicense, isArrestable,
                                    minDays, maxDays, probation, canBeWarrant, addedByReportInEdit
                                ) VALUES (
                                    @ReportId, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable,
                                    @minDays, @maxDays, @probation, @canBeWarrant, @addedByReportInEdit
                                )", connection, transaction)) {
                                cmd.Parameters.AddWithValue("@ReportId", report.Id);
                                cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                                cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                                cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                                cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                                cmd.Parameters.AddWithValue("@minDays", charge.minDays);
                                cmd.Parameters.AddWithValue("@maxDays", charge.maxDays.HasValue ? (object)charge.maxDays.Value : DBNull.Value);
                                cmd.Parameters.AddWithValue("@probation", charge.probation);
                                cmd.Parameters.AddWithValue("@canBeWarrant", charge.canBeWarrant ? 1 : 0);
                                cmd.Parameters.AddWithValue("@addedByReportInEdit", charge.addedByReportInEdit ? 1 : 0);
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    transaction.Commit();
                }
            }
        }

        private static void WriteReportBase(string tableName, Report report, SQLiteTransaction transaction) {
            using (var cmd = new SQLiteCommand($@"
                INSERT OR REPLACE INTO {tableName} (
                    Id, ShortYear, OfficerFirstName, OfficerLastName, OfficerRank,
                    OfficerCallSign, OfficerAgency, OfficerBadgeNumber,
                    LocationArea, LocationStreet, LocationCounty, LocationPostal,
                    TimeStamp, Status, Notes
                ) VALUES (
                    @Id, @ShortYear, @OfficerFirstName, @OfficerLastName, @OfficerRank,
                    @OfficerCallSign, @OfficerAgency, @OfficerBadgeNumber,
                    @LocationArea, @LocationStreet, @LocationCounty, @LocationPostal,
                    @TimeStamp, @Status, @Notes
                )", connection, transaction)) {
                AddReportBaseParams(cmd, report);
                cmd.ExecuteNonQuery();
            }
        }

        private static void AddReportBaseParams(SQLiteCommand cmd, Report report) {
            cmd.Parameters.AddWithValue("@Id", report.Id);
            cmd.Parameters.AddWithValue("@ShortYear", report.ShortYear);
            cmd.Parameters.AddWithValue("@OfficerFirstName", (object)report.OfficerInformation?.firstName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficerLastName", (object)report.OfficerInformation?.lastName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficerRank", (object)report.OfficerInformation?.rank ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficerCallSign", (object)report.OfficerInformation?.callSign ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficerAgency", (object)report.OfficerInformation?.agency ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OfficerBadgeNumber", report.OfficerInformation?.badgeNumber.HasValue == true ? (object)report.OfficerInformation.badgeNumber.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@LocationArea", (object)report.Location?.Area ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@LocationStreet", (object)report.Location?.Street ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@LocationCounty", (object)report.Location?.County ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@LocationPostal", (object)report.Location?.Postal ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TimeStamp", report.TimeStamp.ToString("o"));
            cmd.Parameters.AddWithValue("@Status", (int)report.Status);
            cmd.Parameters.AddWithValue("@Notes", (object)report.Notes ?? DBNull.Value);
        }

        #endregion

        #region Search History

        internal static void SaveSearchHistoryEntry(string searchType, string query, string resultName) {
            lock (dbLock) {
                if (connection == null) return;

                using (var cmd = new SQLiteCommand(@"
                    INSERT INTO search_history (SearchType, SearchQuery, ResultName, Timestamp)
                    VALUES (@type, @query, @result, @ts)", connection)) {
                    cmd.Parameters.AddWithValue("@type", searchType);
                    cmd.Parameters.AddWithValue("@query", query);
                    cmd.Parameters.AddWithValue("@result", (object)resultName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ts", DateTime.UtcNow.ToString("o"));
                    cmd.ExecuteNonQuery();
                }
            }
        }

        internal static List<SearchHistoryEntry> LoadSearchHistory(string searchType, int limit = 10) {
            lock (dbLock) {
                if (connection == null) return new List<SearchHistoryEntry>();

                var entries = new List<SearchHistoryEntry>();

                using (var cmd = new SQLiteCommand(@"
                    SELECT ResultName, Timestamp AS LastSearched
                    FROM search_history
                    WHERE SearchType = @type AND ResultName IS NOT NULL
                    ORDER BY Timestamp DESC
                    LIMIT @limit", connection)) {
                    cmd.Parameters.AddWithValue("@type", searchType);
                    cmd.Parameters.AddWithValue("@limit", limit);

                    using (var reader = cmd.ExecuteReader()) {
                        while (reader.Read()) {
                            entries.Add(new SearchHistoryEntry {
                                ResultName = reader["ResultName"] as string,
                                LastSearched = reader["LastSearched"] as string,
                                SearchCount = 1
                            });
                        }
                    }
                }

                return entries;
            }
        }

        #endregion

        #region Migration

        private static bool HasLegacyJsonFiles() {
            return File.Exists(SetupController.PedDataPath)
                || File.Exists(SetupController.VehicleDataPath)
                || File.Exists(SetupController.CourtDataPath)
                || File.Exists(SetupController.ShiftHistoryDataPath)
                || File.Exists(SetupController.OfficerInformationDataPath)
                || File.Exists(SetupController.IncidentReportsPath)
                || File.Exists(SetupController.CitationReportsPath)
                || File.Exists(SetupController.ArrestReportsPath);
        }

        private static void MigrateFromJson() {
            Helper.Log("Starting JSON to SQLite migration...");

            using (var transaction = connection.BeginTransaction()) {
                try {
                    MigrateFile(SetupController.PedDataPath, (List<EPCPedData> peds) => {
                        foreach (var ped in peds) {
                            if (ped?.Name == null) continue;
                            SavePedInternal(ped, transaction);
                        }
                    });

                    MigrateFile(SetupController.VehicleDataPath, (List<EPCVehicleData> vehicles) => {
                        foreach (var vehicle in vehicles) {
                            if (vehicle?.LicensePlate == null) continue;
                            SaveVehicleInternal(vehicle, transaction);
                        }
                    });

                    MigrateFile(SetupController.CourtDataPath, (List<CourtData> cases) => {
                        foreach (var courtCase in cases) {
                            if (courtCase?.Number == null) continue;
                            SaveCourtCaseInternal(courtCase, transaction);
                        }
                    });

                    MigrateFile(SetupController.OfficerInformationDataPath, (OfficerInformationData officer) => {
                        if (officer == null) return;
                        using (var cmd = new SQLiteCommand(@"
                            INSERT OR REPLACE INTO officer_information (Id, firstName, lastName, rank, callSign, agency, badgeNumber)
                            VALUES (1, @firstName, @lastName, @rank, @callSign, @agency, @badgeNumber)",
                            connection, transaction)) {
                            cmd.Parameters.AddWithValue("@firstName", (object)officer.firstName ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@lastName", (object)officer.lastName ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@rank", (object)officer.rank ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@callSign", (object)officer.callSign ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@agency", (object)officer.agency ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@badgeNumber", officer.badgeNumber.HasValue ? (object)officer.badgeNumber.Value : DBNull.Value);
                            cmd.ExecuteNonQuery();
                        }
                    });

                    MigrateFile(SetupController.ShiftHistoryDataPath, (List<ShiftData> shifts) => {
                        foreach (var shift in shifts) {
                            if (shift == null) continue;
                            SaveShiftInternal(shift, transaction);
                        }
                    });

                    MigrateFile(SetupController.IncidentReportsPath, (List<IncidentReport> reports) => {
                        foreach (var report in reports) {
                            if (report?.Id == null) continue;

                            WriteReportBase("incident_reports", report, transaction);

                            if (report.OffenderPedsNames != null) {
                                foreach (string name in report.OffenderPedsNames) {
                                    if (string.IsNullOrEmpty(name)) continue;
                                    using (var cmd = new SQLiteCommand("INSERT INTO incident_report_offenders (ReportId, PedName) VALUES (@id, @name)", connection, transaction)) {
                                        cmd.Parameters.AddWithValue("@id", report.Id);
                                        cmd.Parameters.AddWithValue("@name", name);
                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }

                            if (report.WitnessPedsNames != null) {
                                foreach (string name in report.WitnessPedsNames) {
                                    if (string.IsNullOrEmpty(name)) continue;
                                    using (var cmd = new SQLiteCommand("INSERT INTO incident_report_witnesses (ReportId, PedName) VALUES (@id, @name)", connection, transaction)) {
                                        cmd.Parameters.AddWithValue("@id", report.Id);
                                        cmd.Parameters.AddWithValue("@name", name);
                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }
                        }
                    });

                    MigrateFile(SetupController.CitationReportsPath, (List<CitationReport> reports) => {
                        foreach (var report in reports) {
                            if (report?.Id == null) continue;

                            using (var cmd = new SQLiteCommand(@"
                                INSERT OR REPLACE INTO citation_reports (
                                    Id, ShortYear, OfficerFirstName, OfficerLastName, OfficerRank,
                                    OfficerCallSign, OfficerAgency, OfficerBadgeNumber,
                                    LocationArea, LocationStreet, LocationCounty, LocationPostal,
                                    TimeStamp, Status, Notes, OffenderPedName,
                                    OffenderVehicleLicensePlate, CourtCaseNumber
                                ) VALUES (
                                    @Id, @ShortYear, @OfficerFirstName, @OfficerLastName, @OfficerRank,
                                    @OfficerCallSign, @OfficerAgency, @OfficerBadgeNumber,
                                    @LocationArea, @LocationStreet, @LocationCounty, @LocationPostal,
                                    @TimeStamp, @Status, @Notes, @OffenderPedName,
                                    @OffenderVehicleLicensePlate, @CourtCaseNumber
                                )", connection, transaction)) {
                                AddReportBaseParams(cmd, report);
                                cmd.Parameters.AddWithValue("@OffenderPedName", (object)report.OffenderPedName ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@OffenderVehicleLicensePlate", (object)report.OffenderVehicleLicensePlate ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@CourtCaseNumber", (object)report.CourtCaseNumber ?? DBNull.Value);
                                cmd.ExecuteNonQuery();
                            }

                            if (report.Charges != null) {
                                foreach (var charge in report.Charges) {
                                    using (var cmd = new SQLiteCommand(@"
                                        INSERT INTO citation_report_charges (ReportId, name, minFine, maxFine, canRevokeLicense, isArrestable, addedByReportInEdit)
                                        VALUES (@ReportId, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable, @addedByReportInEdit)",
                                        connection, transaction)) {
                                        cmd.Parameters.AddWithValue("@ReportId", report.Id);
                                        cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                                        cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                                        cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                                        cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                                        cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                                        cmd.Parameters.AddWithValue("@addedByReportInEdit", charge.addedByReportInEdit ? 1 : 0);
                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }
                        }
                    });

                    MigrateFile(SetupController.ArrestReportsPath, (List<ArrestReport> reports) => {
                        foreach (var report in reports) {
                            if (report?.Id == null) continue;

                            using (var cmd = new SQLiteCommand(@"
                                INSERT OR REPLACE INTO arrest_reports (
                                    Id, ShortYear, OfficerFirstName, OfficerLastName, OfficerRank,
                                    OfficerCallSign, OfficerAgency, OfficerBadgeNumber,
                                    LocationArea, LocationStreet, LocationCounty, LocationPostal,
                                    TimeStamp, Status, Notes, OffenderPedName,
                                    OffenderVehicleLicensePlate, CourtCaseNumber
                                ) VALUES (
                                    @Id, @ShortYear, @OfficerFirstName, @OfficerLastName, @OfficerRank,
                                    @OfficerCallSign, @OfficerAgency, @OfficerBadgeNumber,
                                    @LocationArea, @LocationStreet, @LocationCounty, @LocationPostal,
                                    @TimeStamp, @Status, @Notes, @OffenderPedName,
                                    @OffenderVehicleLicensePlate, @CourtCaseNumber
                                )", connection, transaction)) {
                                AddReportBaseParams(cmd, report);
                                cmd.Parameters.AddWithValue("@OffenderPedName", (object)report.OffenderPedName ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@OffenderVehicleLicensePlate", (object)report.OffenderVehicleLicensePlate ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@CourtCaseNumber", (object)report.CourtCaseNumber ?? DBNull.Value);
                                cmd.ExecuteNonQuery();
                            }

                            if (report.Charges != null) {
                                foreach (var charge in report.Charges) {
                                    using (var cmd = new SQLiteCommand(@"
                                        INSERT INTO arrest_report_charges (
                                            ReportId, name, minFine, maxFine, canRevokeLicense, isArrestable,
                                            minDays, maxDays, probation, canBeWarrant, addedByReportInEdit
                                        ) VALUES (
                                            @ReportId, @name, @minFine, @maxFine, @canRevokeLicense, @isArrestable,
                                            @minDays, @maxDays, @probation, @canBeWarrant, @addedByReportInEdit
                                        )", connection, transaction)) {
                                        cmd.Parameters.AddWithValue("@ReportId", report.Id);
                                        cmd.Parameters.AddWithValue("@name", (object)charge.name ?? DBNull.Value);
                                        cmd.Parameters.AddWithValue("@minFine", charge.minFine);
                                        cmd.Parameters.AddWithValue("@maxFine", charge.maxFine);
                                        cmd.Parameters.AddWithValue("@canRevokeLicense", charge.canRevokeLicense ? 1 : 0);
                                        cmd.Parameters.AddWithValue("@isArrestable", charge.isArrestable ? 1 : 0);
                                        cmd.Parameters.AddWithValue("@minDays", charge.minDays);
                                        cmd.Parameters.AddWithValue("@maxDays", charge.maxDays.HasValue ? (object)charge.maxDays.Value : DBNull.Value);
                                        cmd.Parameters.AddWithValue("@probation", charge.probation);
                                        cmd.Parameters.AddWithValue("@canBeWarrant", charge.canBeWarrant ? 1 : 0);
                                        cmd.Parameters.AddWithValue("@addedByReportInEdit", charge.addedByReportInEdit ? 1 : 0);
                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }
                        }
                    });

                    transaction.Commit();
                    Helper.Log("JSON to SQLite migration completed successfully");
                } catch (Exception e) {
                    transaction.Rollback();
                    Helper.Log($"JSON to SQLite migration failed: {e.Message}", true, Helper.LogSeverity.Error);
                    return;
                }
            }

            RenameJsonFile(SetupController.PedDataPath);
            RenameJsonFile(SetupController.VehicleDataPath);
            RenameJsonFile(SetupController.CourtDataPath);
            RenameJsonFile(SetupController.ShiftHistoryDataPath);
            RenameJsonFile(SetupController.OfficerInformationDataPath);
            RenameJsonFile(SetupController.IncidentReportsPath);
            RenameJsonFile(SetupController.CitationReportsPath);
            RenameJsonFile(SetupController.ArrestReportsPath);
        }

        private static void MigrateFile<T>(string path, Action<T> importAction) where T : new() {
            if (!File.Exists(path)) return;

            T data;
            try {
                data = Helper.ReadFromJsonFile<T>(path);
            } catch (Exception e) {
                Helper.Log($"Failed to read {Path.GetFileName(path)} for migration: {e.Message}", false, Helper.LogSeverity.Warning);
                return;
            }

            if (data != null) {
                importAction(data);
            }
            Helper.Log($"Migrated {Path.GetFileName(path)}");
        }

        private static void RenameJsonFile(string path) {
            if (!File.Exists(path)) return;

            try {
                string backupPath = path + ".bak";
                if (File.Exists(backupPath)) File.Delete(backupPath);
                File.Move(path, backupPath);
            } catch (Exception e) {
                Helper.Log($"Failed to rename {Path.GetFileName(path)}: {e.Message}", false, Helper.LogSeverity.Warning);
            }
        }

        #endregion
    }
}
