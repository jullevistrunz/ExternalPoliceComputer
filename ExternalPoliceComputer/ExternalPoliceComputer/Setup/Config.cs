// Ignore Spelling: Taskbar

namespace ExternalPoliceComputer.Setup {
    internal class Config {
        public int port = 8080;
        public int maxNumberOfNearbyPedsOrVehicles = 15;
        public int databaseLimitMultiplier = 10;
        public int webSocketUpdateInterval = 1000;
        public bool updateDomWithLanguageOnLoad = false;
        public bool useInGameTime = true;
        public int initialWindowWidth = 600;
        public int initialWindowHeight = 400;
        public float hasPriorCitationsProbability = 0.8f;
        public float hasPriorArrestsProbability = 0.2f;
        public float hasPriorArrestsWithWarrantProbability = 0.8f;
        public int maxNumberOfPriorCitations = 5;
        public int maxNumberOfPriorArrests = 3;
        public int maxNumberOfPriorArrestsWithWarrant = 8;
        public string reportIdFormat = "{type}-{shortYear}-{index}"; // available: type, year, shortYear, month, day, index
        public int reportIdIndexPad = 6;
        public bool displayCurrencySymbolBeforeNumber = true;
    }
}
