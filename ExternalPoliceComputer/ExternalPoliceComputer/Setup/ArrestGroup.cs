// Ignore Spelling: Arrestable

using System.Collections.Generic;

namespace ExternalPoliceComputer.Setup {
    public class ArrestGroup : CitationGroup {
        public new List<Charge> charges = new List<Charge>();

        public new class Charge : CitationGroup.Charge {
            public int minDays;
            public int? maxDays;
            public float probation;
            public bool canBeWarrant;
            public new bool isArrestable = true;
        }
    }
}
