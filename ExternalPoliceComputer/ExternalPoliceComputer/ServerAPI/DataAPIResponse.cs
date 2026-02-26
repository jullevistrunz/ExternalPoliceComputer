using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Utility;
using Newtonsoft.Json;
using System.Linq;
using System.Net;
using System.Text;

namespace ExternalPoliceComputer.ServerAPI {
    internal class DataAPIResponse : APIResponse {
        internal DataAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/data/".Length);
            if (string.IsNullOrEmpty(path)) return;
            else if (path == "peds") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.PedDatabase));
                status = 200;
                contentType = "text/json";
            } else if (path == "vehicles") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.VehicleDatabase));
                status = 200;
                contentType = "text/json";
            } else if (path == "specificPed") {
                string body = Helper.GetRequestPostData(req);
                string name = !string.IsNullOrEmpty(body) ? body : "";
                string reversedName = string.Join(" ", name.Split(' ').Reverse());

                EPCPedData pedData = DataController.PedDatabase.FirstOrDefault(o => o.Name?.ToLower() == name.ToLower() || o.Name?.ToLower() == reversedName.ToLower());

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(pedData));
                contentType = "text/json";
                status = 200;
            } else if (path == "specificVehicle") {
                string body = Helper.GetRequestPostData(req);
                string licensePlateOrVin = !string.IsNullOrEmpty(body) ? body : "";

                EPCVehicleData vehicleData = DataController.VehicleDatabase.FirstOrDefault(o => o.LicensePlate?.ToLower() == licensePlateOrVin.ToLower() ||o.VehicleIdentificationNumber?.ToLower() == licensePlateOrVin.ToLower());

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(vehicleData));
                contentType = "text/json";
                status = 200;
            } else if (path == "officerInformation") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.OfficerInformation));
                contentType = "text/json";
                status = 200;
            } else if (path == "officerInformationData") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.OfficerInformationData));
                status = 200;
                contentType = "text/json";
            } else if (path == "court") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.courtDatabase));
                status = 200;
                contentType = "text/json";
            } else if (path == "currentShift") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.CurrentShiftData));
                status = 200;
                contentType = "text/json";
            } else if (path == "shiftHistory") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.shiftHistoryData));
                status = 200;
                contentType = "text/json";
            } else if (path == "incidentReports") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.incidentReports));
                status = 200;
                contentType = "text/json";
            } else if (path == "citationReports") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.citationReports));
                status = 200;
                contentType = "text/json";
            } else if (path == "arrestReports") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.arrestReports));
                status = 200;
                contentType = "text/json";
            } else if (path == "playerLocation") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.PlayerLocation));
                status = 200;
                contentType = "text/json";
            } else if (path == "currentTime") {
                buffer = Encoding.UTF8.GetBytes(DataController.CurrentTime);
                status = 200;
                contentType = "text/plain";
            } else if (path == "activePostalCodeSet") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(CommonDataFramework.Modules.Postals.PostalCodeController.ActivePostalCodeSet));
                status = 200;
                contentType = "text/plain";
            }
        }
    }
}
