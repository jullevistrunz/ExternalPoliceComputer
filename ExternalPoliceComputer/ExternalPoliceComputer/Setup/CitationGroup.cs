// Ignore Spelling: Arrestable

using System.Collections.Generic;

namespace ExternalPoliceComputer.Setup {
    public class CitationGroup {
        public string name;
        public List<Charge> charges = new List<Charge>();

        public class Charge {
            public string name;
            public int minFine;
            public int maxFine;
            public bool canRevokeLicense;
            public bool isArrestable;
        }
    }
}
