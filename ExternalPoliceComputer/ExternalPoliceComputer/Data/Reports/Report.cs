using Rage;
using System;

namespace ExternalPoliceComputer.Data.Reports {
    public class Report {
        public string Id;
        public OfficerInformationData OfficerInformation;
        public Location Location;
        public DateTime TimeStamp;
        public ReportStatus Status;
        public string Notes;
    }

    public class Location {
        public string Area;
        public string Street;
        public string County;
        public string Postal;

        internal Location(Vector3 vector3) {
            LSPD_First_Response.Engine.Scripting.WorldZone zone = LSPD_First_Response.Mod.API.Functions.GetZoneAtPosition(vector3);
            Area = zone.RealAreaName;
            Street = World.GetStreetName(vector3);
            County = zone.County.ToString();
            Postal = CommonDataFramework.Modules.Postals.PostalCodeController.GetPostalCode(vector3);
        }
    }
    
    public enum ReportStatus {
        Open,
        Closed,
        Canceled
    }
}
