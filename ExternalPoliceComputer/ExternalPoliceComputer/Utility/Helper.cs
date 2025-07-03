using Newtonsoft.Json;
using Rage;
using System;
using System.IO;
using System.Net;
using System.Xml;


namespace ExternalPoliceComputer.Utility {
    internal class Helper {
        internal static T ReadFromJsonFile<T>(string filePath) where T : new() {
            return File.Exists(filePath) ? JsonConvert.DeserializeObject<T>(File.ReadAllText(filePath)) : default;
        }
        internal static void WriteToJsonFile<T>(string filePath, T objectToWrite) where T : new() {
            File.WriteAllText(filePath, JsonConvert.SerializeObject(objectToWrite, Newtonsoft.Json.Formatting.Indented));
        }

        internal static void Log(string message, bool logInGame = false, LogSeverity severity = LogSeverity.Info) {
            if (logInGame) Game.LogTrivial($"ExternalPoliceComputer: [{severity}] {message}");
            try {
                string oldLog = File.ReadAllText(Setup.SetupController.LogFilePath);
                File.WriteAllText(Setup.SetupController.LogFilePath, $"{oldLog}\n[{DateTime.Now:O}] [{severity}] {message}");
            } catch { }
        }

        internal enum LogSeverity {
            Info, Warning, Error
        }

        internal static void ClearLog() {
            File.WriteAllText(Setup.SetupController.LogFilePath, $"[{DateTime.Now:O}] [{LogSeverity.Info}] EPC log initialized");
        }

        internal static string GetRequestPostData(HttpListenerRequest req) {
            if (!req.HasEntityBody) return null;
            using Stream body = req.InputStream;
            using StreamReader reader = new StreamReader(body, req.ContentEncoding);
            return reader.ReadToEnd();
        }

        internal static string GetAgencyNameFromScriptName(string scriptName) {
            XmlDocument xmlDoc = new XmlDocument();
            if (!File.Exists("lspdfr/data/agency.xml")) {
                Log("Agency XML file not found, returning null.", true, LogSeverity.Warning);
                return null;
            }

            xmlDoc.Load("lspdfr/data/agency.xml");

            XmlNodeList agencies = xmlDoc.SelectNodes("/Agencies/Agency");

            foreach (XmlNode agency in agencies) {
                XmlNode scriptNameNode = agency.SelectSingleNode("ScriptName");
                if (scriptNameNode != null && scriptNameNode.InnerText.Equals(scriptName, StringComparison.OrdinalIgnoreCase)) {
                    XmlNode nameNode = agency.SelectSingleNode("Name");
                    if (nameNode != null) {
                        return nameNode.InnerText;
                    }
                }
            }

            return null; 
        }


        internal static string GetCallSignFromIPTCommon() {
            return IPT.Common.Handlers.PlayerHandler.GetCallsign();
        }
    }
}
