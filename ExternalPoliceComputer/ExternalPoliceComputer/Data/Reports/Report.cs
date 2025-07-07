using Rage;
using System;

namespace ExternalPoliceComputer.Data.Reports {
    public class Report {
        public string Id;
        public int ShortYear; // this will cause issues in 100 years, but by then I'll be dead and it will no longer be my problem
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

        public Location() { }
    }
    
    public enum ReportStatus {
        Closed,
        Open,
        Canceled
    }
}
