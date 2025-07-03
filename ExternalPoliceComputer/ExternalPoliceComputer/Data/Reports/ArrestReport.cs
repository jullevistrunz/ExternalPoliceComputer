using ExternalPoliceComputer.Setup;
using System.Collections.Generic;

namespace ExternalPoliceComputer.Data.Reports {
    public class ArrestReport : Report {
        public List<ArrestGroup.Charge> Charges;
        public string OffenderPedName;
        public string OffenderVehicleLicensePlate;
    }
}
