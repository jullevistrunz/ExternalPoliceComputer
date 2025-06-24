using System.Collections.Generic;

namespace ExternalPoliceComputer.Data {
    public class CourtData {
        public string pedName;
        public string number;
        public List<Charge> charges = new List<Charge>();

        public class Charge {
            public string name;
            public int fine;
            public int time; // days in jail/prison
        }

        public int totalFine;
        public int totalTime; // days in jail/prison
    }
}
