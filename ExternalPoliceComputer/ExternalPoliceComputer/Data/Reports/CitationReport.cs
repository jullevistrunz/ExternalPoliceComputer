using ExternalPoliceComputer.Setup;
using System.Collections.Generic;

namespace ExternalPoliceComputer.Data.Reports {
    public class CitationReport : Report {
        public List<Charge> Charges;
        public string OffenderPedName;
        public string OffenderVehicleLicensePlate;
        public string CourtCaseNumber;
        
        public class Charge : CitationGroup.Charge {
            public bool addedByReportInEdit = false;
        }
    }
}
