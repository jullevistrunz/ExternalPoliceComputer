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

                Database.SavePed(pedData);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "updateVehicleData") {
                EPCVehicleData vehicleData = JsonConvert.DeserializeObject<EPCVehicleData>(body);

                DataController.UpdateVehicleData(vehicleData);

                DataController.SyncVehicleDatabaseWithCDF();

                Database.SaveVehicle(vehicleData);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "updateOfficerInformationData") {
                DataController.OfficerInformationData = JsonConvert.DeserializeObject<OfficerInformationData>(body);

                Database.SaveOfficerInformation(DataController.OfficerInformationData);

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

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createIncidentReport") {
                IncidentReport report = JsonConvert.DeserializeObject<IncidentReport>(body);

                DataController.AddReport(report);

                Database.SaveIncidentReport(report);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createCitationReport") {
                CitationReport report = JsonConvert.DeserializeObject<CitationReport>(body);

                DataController.AddReport(report);

                Database.SaveCitationReport(report);

                CourtData courtCase = DataController.courtDatabase.Find(x => x.Number == report.CourtCaseNumber);
                if (courtCase != null) Database.SaveCourtCase(courtCase);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "createArrestReport") {
                ArrestReport report = JsonConvert.DeserializeObject<ArrestReport>(body);

                DataController.AddReport(report);

                Database.SaveArrestReport(report);

                CourtData courtCase = DataController.courtDatabase.Find(x => x.Number == report.CourtCaseNumber);
                if (courtCase != null) Database.SaveCourtCase(courtCase);

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            } else if (path == "updateCourtCaseStatus") {
                var data = JsonConvert.DeserializeAnonymousType(body, new { Number = "", Status = 0 });

                CourtData courtCase = DataController.courtDatabase.Find(x => x.Number == data.Number);
                if (courtCase != null) {
                    courtCase.Status = data.Status;
                    Database.SaveCourtCase(courtCase);

                    buffer = Encoding.UTF8.GetBytes("OK");
                    contentType = "text/plain";
                    status = 200;
                } else {
                    buffer = Encoding.UTF8.GetBytes("Not Found");
                    contentType = "text/plain";
                    status = 404;
                }
            } else if (path == "updateConfig") {
                Config config = JsonConvert.DeserializeObject<Config>(body);

                Helper.WriteToJsonFile(SetupController.ConfigPath, config);

                SetupController.ResetConfig();

                buffer = Encoding.UTF8.GetBytes("OK");
                contentType = "text/plain";
                status = 200;
            }
        }
    }
}
