using ExternalPoliceComputer.Setup;
using System.Collections.Generic;

namespace ExternalPoliceComputer.Data.Reports {
    public class ArrestReport : Report {
        public List<Charge> Charges;
        public string OffenderPedName;
        public string OffenderVehicleLicensePlate;

        public class Charge : ArrestGroup.Charge {
            public bool addedByReportInEdit = false;
        }
    }
}
