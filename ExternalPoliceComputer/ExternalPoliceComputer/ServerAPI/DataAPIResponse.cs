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

                EPCPedData pedData = DataController.PedDatabase.FirstOrDefault(o => o.Name?.ToLower() == name.ToLower());

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(pedData));
                contentType = "text/plain";
                status = 200;
            } else if (path == "specificVehicle") {
                string body = Helper.GetRequestPostData(req);
                string licensePlateOrVin = !string.IsNullOrEmpty(body) ? body : "";

                EPCVehicleData vehicleData = DataController.VehicleDatabase.FirstOrDefault(o => o.LicensePlate?.ToLower() == licensePlateOrVin.ToLower() ||o.VehicleIdentificationNumber?.ToLower() == licensePlateOrVin.ToLower());

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(vehicleData));
                contentType = "text/plain";
                status = 200;
            } else if (path == "officerInformation") {
                Helper.Log(LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName());
                string agency = Helper.GetAgencyNameFromScriptName(LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName()) ?? LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName();
                LSPD_First_Response.Engine.Scripting.Entities.Persona persona = LSPD_First_Response.Mod.API.Functions.GetPersonaForPed(Main.Player);
                string firstName = persona.Forename;
                string lastName = persona.Surname;
                string callSign = DependencyCheck.IsIPTCommonAvailable() ? Helper.GetCallSignFromIPTCommon() : null;

                object response = new {
                    agency,
                    firstName,
                    lastName,
                    callSign
                };

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(response));
                contentType = "text/json";
                status = 200;
            } else if (path == "officerInformationData") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(DataController.officerInformationData));
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
            }
        }
    }
}
