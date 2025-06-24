using System;

namespace ExternalPoliceComputer.Data {
    public class Report {
        public OfficerInformationData officerInformation;
        public Location location;
        public DateTime timeStamp;
        public EPCPedData offenderPed;
        public EPCVehicleData offenderVehicle;

        public class Location {
            public string area;
            public string street;
            public string county;
        }
    }
}
