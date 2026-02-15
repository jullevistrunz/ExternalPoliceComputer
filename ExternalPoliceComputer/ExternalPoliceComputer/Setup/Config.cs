// Ignore Spelling: Taskbar

namespace ExternalPoliceComputer.Setup {
    internal class Config {
        public int port = 8080;
        public int maxNumberOfNearbyPedsOrVehicles = 15;
        public int databaseLimitMultiplier = 10;
        public int webSocketUpdateInterval = 1000;
        public int databaseUpdateInterval = 15000;
        public bool updateDomWithLanguageOnLoad = false;
        public bool useInGameTime = false;
        public bool showSecondsInTaskbarClock = false;
        public int initialWindowWidth = 600;
        public int initialWindowHeight = 400;
        public float hasPriorCitationsProbability = 0.8f;
        public float hasPriorArrestsProbability = 0.2f;
        public float hasPriorArrestsWithWarrantProbability = 0.8f;
        public int maxNumberOfPriorCitations = 5;
        public int maxNumberOfPriorArrests = 3;
        public int maxNumberOfPriorArrestsWithWarrant = 8;

        // available: type (reportId only), year, shortYear, month, day, index
        // reportIds/courtCaseNumbers must be unique, to achieve this year/shortYear and index must be included
        public string reportIdFormat = "{type}-{shortYear}-{index}"; 
        public int reportIdIndexPad = 6;
        public string courtCaseNumberFormat = "{shortYear}-{index}";
        public int courtCaseNumberIndexPad = 6;

        public bool displayCurrencySymbolBeforeNumber = true;
        public int courtDatabaseMaxEntries = 100;
    }
}
