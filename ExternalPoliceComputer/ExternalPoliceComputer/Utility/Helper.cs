using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Setup;
using Newtonsoft.Json;
using Rage;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
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

        internal static string GenerateUniqueId(int length) {
            if (length <= 0) return string.Empty;

            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random random = new Random();
            char[] id = new char[length];

            for (int i = 0; i < length; i++) {
                id[i] = chars[random.Next(chars.Length)];
            }

            return new string(id);
        }

        internal static string GetLocalIPAddress() {
            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces()) {
                if (ni.OperationalStatus != OperationalStatus.Up ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;

                IPInterfaceProperties ipProps = ni.GetIPProperties();

                foreach (UnicastIPAddressInformation addr in ipProps.UnicastAddresses) {
                    if (addr.Address.AddressFamily == AddressFamily.InterNetwork &&
                        !IPAddress.IsLoopback(addr.Address) &&
                        !addr.Address.ToString().StartsWith("169.254")) {
                        return addr.Address.ToString();
                    }
                }
            }

            return "";
        }

        internal static string GetCourtCaseNumber() {
            string number = SetupController.GetConfig().courtCaseNumberFormat;
            int index = 1;
            foreach (CourtData caseData in DataController.courtDatabase) {
                if (caseData.ShortYear == int.Parse(DateTime.Now.ToString("yy"))) index++;
            }

            number = number.Replace("{shortYear}", DateTime.Now.ToString("yy"));
            number = number.Replace("{year}", DateTime.Now.ToString("yyyy"));
            number = number.Replace("{month}", DateTime.Now.ToString("MM"));
            number = number.Replace("{day}", DateTime.Now.ToString("dd"));
            number = number.Replace("{index}", index.ToString().PadLeft(SetupController.GetConfig().courtCaseNumberIndexPad, '0'));

            return number;
        }


        private static readonly Random random = new Random();
        internal static int GetRandomInt(int min, int max) => random.Next(min, max + 1);

        internal static bool UrlAclExists(string url) {
            Process process = new Process();
            process.StartInfo.FileName = "netsh";
            process.StartInfo.Arguments = "http show urlacl";
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.CreateNoWindow = true;

            process.Start();
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            return output.Contains(url);
        }

        public static bool AddUrlAcl(string url) {
            Process process = new Process();
            process.StartInfo.FileName = "netsh";
            process.StartInfo.Arguments = $"http add urlacl url={url} user=\"{System.Security.Principal.WindowsIdentity.GetCurrent().Name}\"";
            process.StartInfo.UseShellExecute = true;
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.Verb = "runas";

            process.Start();
            process.WaitForExit();

            return process.ExitCode == 0;
        }
    }
}
