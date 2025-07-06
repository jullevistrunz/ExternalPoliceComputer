using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Setup;
using ExternalPoliceComputer.Utility;
using Newtonsoft.Json;
using System.Net;
using System.Text;

namespace ExternalPoliceComputer.ServerAPI {
    internal class PostAPIResponse : APIResponse {
        internal PostAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/post/".Length);
            if (string.IsNullOrEmpty(path)) return;

            string body = Helper.GetRequestPostData(req);
            if (string.IsNullOrEmpty(body)) {
                buffer = Encoding.UTF8.GetBytes("Bad Request - Empty Body");
                contentType = "text/plain";
                status = 400;
                return;
            } else if (path == "updatePedData") {
                EPCPedData pedData = JsonConvert.DeserializeObject<EPCPedData>(body);

                DataController.UpdatePedData(pedData);

                DataController.SyncPedDatabaseWithCDF();

                Helper.WriteToJsonFile(SetupController.PedDataPath, DataController.GetPedDataToSave());

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "updateVehicleData") {
                EPCVehicleData vehicleData = JsonConvert.DeserializeObject<EPCVehicleData>(body);

                DataController.UpdateVehicleData(vehicleData);

                DataController.SyncVehicleDatabaseWithCDF();

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "updateOfficerInformationData") {
                DataController.officerInformationData = JsonConvert.DeserializeObject<OfficerInformationData>(body);

                Helper.WriteToJsonFile(SetupController.OfficerInformationDataPath, DataController.officerInformationData);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "modifyCurrentShift") {
                if (body == "start") {
                    DataController.StartCurrentShift();
                } else if (body == "end") {
                    DataController.EndCurrentShift();
                } else {
                    buffer = Encoding.UTF8.GetBytes("Bad Request - Invalid Action");
                    contentType = "text/plain";
                    status = 400;
                    return;
                }

                Helper.WriteToJsonFile(SetupController.ShiftHistoryDataPath, DataController.shiftHistoryData);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createIncidentReport") {
                Report report = JsonConvert.DeserializeObject<Report>(body);

                DataController.AddReport(report);

                Helper.WriteToJsonFile(SetupController.IncidentReportsPath, DataController.incidentReports);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createCitationReport") {
                CitationReport report = JsonConvert.DeserializeObject<CitationReport>(body);

                DataController.AddReport(report);

                Helper.WriteToJsonFile(SetupController.CitationReportsPath, DataController.citationReports);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createArrestReport") {
                ArrestReport report = JsonConvert.DeserializeObject<ArrestReport>(body);

                DataController.AddReport(report);

                Helper.WriteToJsonFile(SetupController.ArrestReportsPath, DataController.arrestReports);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            }
        }
    }
}
