using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Utility;
using Newtonsoft.Json;
using System;
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
            } else if (path == "nearbyVehicles") {
                string body = Helper.GetRequestPostData(req);
                int limit = 5;
                if (int.TryParse(body, out int parsedLimit)) {
                    limit = parsedLimit;
                }
                if (limit < 1) limit = 1;
                if (limit > 20) limit = 20;

                bool hasPlayer = Main.Player != null && Main.Player.Exists();

                var nearbyVehicles = DataController.VehicleDatabase
                    .Where(vehicleData => !string.IsNullOrEmpty(vehicleData.LicensePlate))
                    .Select(vehicleData => new {
                        vehicleData,
                        distance = hasPlayer && vehicleData.Holder != null && vehicleData.Holder.Exists()
                            ? Main.Player.DistanceTo(vehicleData.Holder)
                            : float.MaxValue
                    })
                    .OrderBy(x => x.distance)
                    .ThenBy(x => x.vehicleData.LicensePlate)
                    .Take(limit)
                    .Select(x => new {
                        x.vehicleData.LicensePlate,
                        x.vehicleData.ModelDisplayName,
                        Distance = x.distance == float.MaxValue ? (float?)null : (float?)Math.Round(x.distance, 1),
                        x.vehicleData.IsStolen
                    });

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(nearbyVehicles));
                status = 200;
                contentType = "text/json";
            } else if (path == "specificPed") {
                string body = Helper.GetRequestPostData(req);
                string name = !string.IsNullOrEmpty(body) ? body : "";
                string reversedName = string.Join(" ", name.Split(' ').Reverse());

                EPCPedData pedData = DataController.PedDatabase.FirstOrDefault(o => o.Name?.ToLower() == name.ToLower() || o.Name?.ToLower() == reversedName.ToLower());

                Database.SaveSearchHistoryEntry("ped", name, pedData?.Name);
                if (pedData != null) {
                    DataController.KeepPedInDatabase(pedData);
                }

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(pedData));
                contentType = "text/json";
                status = 200;
            } else if (path == "specificVehicle") {
                string body = Helper.GetRequestPostData(req);
                string licensePlateOrVin = !string.IsNullOrEmpty(body) ? body : "";

                EPCVehicleData vehicleData = DataController.VehicleDatabase.FirstOrDefault(o => o.LicensePlate?.ToLower() == licensePlateOrVin.ToLower() ||o.VehicleIdentificationNumber?.ToLower() == licensePlateOrVin.ToLower());

                Database.SaveSearchHistoryEntry("vehicle", licensePlateOrVin, vehicleData?.LicensePlate);

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
            } else if (path == "searchHistory") {
                string body = Helper.GetRequestPostData(req);
                string type = !string.IsNullOrEmpty(body) ? body : "ped";
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(Database.LoadSearchHistory(type)));
                status = 200;
                contentType = "text/json";
            } else if (path == "pedReports") {
                string body = Helper.GetRequestPostData(req);
                string pedName = !string.IsNullOrEmpty(body) ? body.ToLower() : "";

                var result = new {
                    citations = DataController.citationReports
                        .Where(r => r.OffenderPedName?.ToLower() == pedName)
                        .Select(r => new { r.Id, r.TimeStamp, r.Status }),
                    arrests = DataController.arrestReports
                        .Where(r => r.OffenderPedName?.ToLower() == pedName)
                        .Select(r => new { r.Id, r.TimeStamp, r.Status }),
                    incidents = DataController.incidentReports
                        .Where(r => (r.OffenderPedsNames != null && r.OffenderPedsNames.Any(n => n.ToLower() == pedName))
                                 || (r.WitnessPedsNames != null && r.WitnessPedsNames.Any(n => n.ToLower() == pedName)))
                        .Select(r => new { r.Id, r.TimeStamp, r.Status })
                };

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(result));
                status = 200;
                contentType = "text/json";
            } else if (path == "pedVehicles") {
                string body = Helper.GetRequestPostData(req);
                string pedName = !string.IsNullOrEmpty(body) ? body : "";

                var vehicles = DataController.VehicleDatabase
                    .Where(v => v.Owner != null && v.Owner.ToLower() == pedName.ToLower())
                    .Select(v => new { v.LicensePlate, v.ModelDisplayName, v.IsStolen, v.Color });

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(vehicles));
                status = 200;
                contentType = "text/json";
            } else if (path == "officerMetrics") {
                var shifts = DataController.shiftHistoryData;
                int totalShifts = shifts.Count;

                double avgShiftMs = 0;
                if (totalShifts > 0) {
                    var completedShifts = shifts.Where(s => s.startTime.HasValue && s.endTime.HasValue).ToList();
                    if (completedShifts.Count > 0) {
                        avgShiftMs = completedShifts.Average(s => (s.endTime.Value - s.startTime.Value).TotalMilliseconds);
                    }
                }

                int totalIncident = DataController.incidentReports.Count;
                int totalCitation = DataController.citationReports.Count;
                int totalArrest = DataController.arrestReports.Count;
                int totalReports = totalIncident + totalCitation + totalArrest;

                var metrics = new {
                    totalShifts,
                    averageShiftDurationMs = avgShiftMs,
                    totalIncidentReports = totalIncident,
                    totalCitationReports = totalCitation,
                    totalArrestReports = totalArrest,
                    totalReports,
                    reportsPerShift = totalShifts > 0 ? Math.Round((double)totalReports / totalShifts, 1) : 0
                };

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(metrics));
                status = 200;
                contentType = "text/json";
            } else if (path == "repeatOffenders") {
                var offenders = DataController.PedDatabase
                    .Where(p => (p.Citations != null ? p.Citations.Count : 0) + (p.Arrests != null ? p.Arrests.Count : 0) > 1)
                    .OrderByDescending(p => (p.Citations != null ? p.Citations.Count : 0) + (p.Arrests != null ? p.Arrests.Count : 0))
                    .Take(20)
                    .Select(p => new {
                        p.Name,
                        p.TimesStopped,
                        CitationCount = p.Citations != null ? p.Citations.Count : 0,
                        ArrestCount = p.Arrests != null ? p.Arrests.Count : 0,
                        p.IsWanted,
                        p.IsOnProbation,
                        p.IsOnParole
                    });

                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(offenders));
                status = 200;
                contentType = "text/json";
            } else if (path == "activePostalCodeSet") {
                buffer = Encoding.UTF8.GetBytes(DataController.ActivePostalCodeSet);
                status = 200;
                contentType = "text/plain";
            }
        }
    }
}
