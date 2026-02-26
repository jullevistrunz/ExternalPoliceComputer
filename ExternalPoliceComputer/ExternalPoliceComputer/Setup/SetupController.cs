using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Utility;
using Newtonsoft.Json;
using Rage;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace ExternalPoliceComputer.Setup {
    internal class SetupController {
        internal static readonly string EPCPath = "EPC";
        internal static readonly string DataPath = $"{EPCPath}/data";
        internal static readonly string ReportsDataPath = $"{DataPath}/reports";
        internal static readonly string DefaultsPath = $"{EPCPath}/defaults";
        internal static readonly string ConfigPath = $"{EPCPath}/config.json";
        internal static readonly string LanguagePath = $"{EPCPath}/language.json";
        internal static readonly string CitationOptionsPath = $"{EPCPath}/citationOptions.json";
        internal static readonly string ArrestOptionsPath = $"{EPCPath}/arrestOptions.json";
        internal static readonly string CitationOptionsDefaultsPath = $"{DefaultsPath}/citationOptions.json";
        internal static readonly string ArrestOptionsDefaultsPath = $"{DefaultsPath}/arrestOptions.json";
        internal static readonly string PedDataPath = $"{DataPath}/peds.json";
        internal static readonly string VehicleDataPath = $"{DataPath}/vehicles.json";
        internal static readonly string CourtDataPath = $"{DataPath}/court.json";
        internal static readonly string ShiftHistoryDataPath = $"{DataPath}/shiftHistory.json";
        internal static readonly string OfficerInformationDataPath = $"{DataPath}/officerInformation.json";
        internal static readonly string LogFilePath = $"{EPCPath}/EPC.log";
        internal static readonly string ImgDefaultsDirPath = $"{EPCPath}/imgDefaults";
        internal static readonly string ImgDirPath = $"{EPCPath}/img";
        internal static readonly string IncidentReportsPath = $"{ReportsDataPath}/incidentReports.json";
        internal static readonly string CitationReportsPath = $"{ReportsDataPath}/citationReports.json";
        internal static readonly string ArrestReportsPath = $"{ReportsDataPath}/arrestReports.json";
        internal static readonly string IpAddressesPath = $"{EPCPath}/ipAddresses.txt";
        internal static readonly string PluginsPath = $"{EPCPath}/plugins";

        internal static void SetupDirectory() {
            if (!Directory.Exists(DataPath)) {
                Directory.CreateDirectory(DataPath);
            }

            if (!Directory.Exists(ReportsDataPath)) {
                Directory.CreateDirectory(ReportsDataPath);
            }

            if (!File.Exists(PedDataPath)) {
                File.WriteAllText(PedDataPath, "[]");
            }

            if (!File.Exists(VehicleDataPath)) {
                File.WriteAllText(VehicleDataPath, "[]");
            }

            if (!File.Exists(CourtDataPath)) {
                File.WriteAllText(CourtDataPath, "[]");
            }

            if (!File.Exists(ShiftHistoryDataPath)) {
                File.WriteAllText(ShiftHistoryDataPath, "[]");
            }

            if (!File.Exists(OfficerInformationDataPath)) {
                Helper.WriteToJsonFile(OfficerInformationDataPath, new OfficerInformationData());
            }

            if (!File.Exists(CitationOptionsPath)) {
                File.WriteAllBytes(CitationOptionsPath, File.ReadAllBytes(CitationOptionsDefaultsPath));
            }

            if (!File.Exists(ArrestOptionsPath)) {
                File.WriteAllBytes(ArrestOptionsPath, File.ReadAllBytes(ArrestOptionsDefaultsPath));
            }

            if (!File.Exists(IncidentReportsPath)) {
                File.WriteAllText(IncidentReportsPath, "[]");
            }

            if (!File.Exists(CitationReportsPath)) {
                File.WriteAllText(CitationReportsPath, "[]");
            }

            if (!File.Exists(ArrestReportsPath)) {
                File.WriteAllText(ArrestReportsPath, "[]");
            }

            if (!Directory.Exists(PluginsPath)) {
                Directory.CreateDirectory(PluginsPath);
            }

            DataController.OfficerInformationData = Helper.ReadFromJsonFile<OfficerInformationData>(OfficerInformationDataPath);

            DataController.courtDatabase = Helper.ReadFromJsonFile<List<CourtData>>(CourtDataPath) ?? new List<CourtData>();

            DataController.shiftHistoryData = Helper.ReadFromJsonFile<List<ShiftData>>(ShiftHistoryDataPath) ?? new List<ShiftData>();

            DataController.incidentReports = Helper.ReadFromJsonFile<List<IncidentReport>>(IncidentReportsPath);

            DataController.citationReports = Helper.ReadFromJsonFile<List<CitationReport>>(CitationReportsPath);

            DataController.arrestReports = Helper.ReadFromJsonFile<List<ArrestReport>>(ArrestReportsPath);

            DataController.LoadPedDatabaseFromFile();
            DataController.LoadVehicleDatabaseFromFile();
            DataController.SetOfficerInformation();

            DataController.ActivePostalCodeSet = JsonConvert.SerializeObject(CommonDataFramework.Modules.Postals.PostalCodeController.ActivePostalCodeSet);

            if (!File.Exists(ConfigPath)) {
                Helper.WriteToJsonFile(ConfigPath, new Config());
            }

            if (!File.Exists(LanguagePath)) {
                Helper.WriteToJsonFile(LanguagePath, new Language());
            }

            GameFiber.StartNew(() => {
                while (Server.RunServer) {
                    DataController.SetDatabases();
                    GameFiber.Wait(GetConfig().databaseUpdateInterval);
                }
            }, "data-update-interval");

            GameFiber.StartNew(() => {
                while (Server.RunServer) {
                    DataController.SetDynamicData();
                    GameFiber.Wait(GetConfig().webSocketUpdateInterval);
                }
            }, "dynamic-data-update-interval");

            string[] imgDefaultsDir = Directory.GetFiles(ImgDefaultsDirPath).Select(item => item.Split('\\')[item.Split('\\').Length - 1]).ToArray();
            if (!Directory.Exists(ImgDirPath)) Directory.CreateDirectory(ImgDirPath);
            foreach (string imgNameInDefaultDir in imgDefaultsDir) {
                if (File.Exists($"{ImgDirPath}/{imgNameInDefaultDir}")) continue;
                File.WriteAllBytes($"{ImgDirPath}/{imgNameInDefaultDir}", File.ReadAllBytes($"{ImgDefaultsDirPath}/{imgNameInDefaultDir}"));
            }

            Helper.ClearLog();
            Helper.Log($"Version: {Main.Version}");
            Helper.Log($"Log path: {Path.GetFullPath(LogFilePath)}");

            Config config = GetConfig();
            Helper.Log($"Config:\n{JsonConvert.SerializeObject(config, Formatting.Indented)}");

            string[] EPCDirectoryFiles = Directory.GetFiles(EPCPath).Select(item => $"[File] {item.Split('\\')[1]}").ToArray();
            string[] EPCDirectoryDirs = Directory.GetDirectories(EPCPath).Select(item => $"[Directory] {item.Split('\\')[1]}").ToArray();
            string[] EPCDirectoryFilesAndDirs = EPCDirectoryFiles.Concat(EPCDirectoryDirs).ToArray();
            Helper.Log($"EPC Directory:\n  {string.Join("\n  ", EPCDirectoryFilesAndDirs)}");
        }

        internal static void ClearCache() {
            cachedConfig = null;
            cachedLanguage = null;
            cachedCitationOptions = null;
            cachedArrestOptions = null;
        }

        private static Config cachedConfig;
        internal static Config GetConfig() {
            if (cachedConfig == null) {
                cachedConfig = Helper.ReadFromJsonFile<Config>(ConfigPath) ?? new Config();
                Helper.WriteToJsonFile(ConfigPath, cachedConfig);
            }
            return cachedConfig;
        }

        internal static void ResetConfig() {
            cachedConfig = null;
        }

        private static Language cachedLanguage;
        internal static Language GetLanguage() {
            if (cachedLanguage == null) {
                cachedLanguage = Helper.ReadFromJsonFile<Language>(LanguagePath) ?? new Language();
                Helper.WriteToJsonFile(LanguagePath, cachedLanguage);
            }
            return cachedLanguage;
        }

        private static List<CitationGroup> cachedCitationOptions;
        internal static List<CitationGroup> GetCitationOptions() {
            cachedCitationOptions ??= Helper.ReadFromJsonFile<List<CitationGroup>>(CitationOptionsPath);
            return cachedCitationOptions;
        }

        private static List<ArrestGroup> cachedArrestOptions;
        internal static List<ArrestGroup> GetArrestOptions() {
            cachedArrestOptions ??= Helper.ReadFromJsonFile<List<ArrestGroup>>(ArrestOptionsPath);
            return cachedArrestOptions;
        }

        internal static List<EPCPedData> GetEPCPedData() {
            return Helper.ReadFromJsonFile<List<EPCPedData>>(PedDataPath);
        }

        internal static List<EPCVehicleData> GetEPCVehicleData() {
            return Helper.ReadFromJsonFile<List<EPCVehicleData>>(VehicleDataPath);
        }
    }
}
