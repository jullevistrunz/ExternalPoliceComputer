using ExternalPoliceComputer.Setup;
using System.Collections.Generic;

namespace ExternalPoliceComputer.Data.Reports {
    public class CitationReport : Report {
        public List<CitationGroup.Charge> Charges;
        public string OffenderPedName;
        public string OffenderVehicleLicensePlate;
    }
}
