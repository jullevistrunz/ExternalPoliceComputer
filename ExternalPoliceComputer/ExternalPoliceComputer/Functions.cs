using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Web;

namespace ExternalPoliceComputer {
    public static class Functions {

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void SendMessage(string message) {
            if (Main.useCI && File.ReadAllText($"{Main.DataPath}/callout.data").Length > 0) {

                message = Main.MakeStringWorkWithMyStupidQueryStrings(message);

                NameValueCollection calloutData = HttpUtility.ParseQueryString(File.ReadAllText($"{Main.DataPath}/callout.data"));

                Main.UpdateCalloutData("additionalMessage", calloutData["additionalMessage"] + message + "<br>");
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void AddCautionToPed(string name, string message) {
            string pedsCautionsData = File.ReadAllText($"{Main.DataPath}/pedsCautions.data");
            List<string> pedsCautionsDataList = pedsCautionsData.Split(',').ToList();

            bool pedHasCautions = false;
            
            for (int i = 0; i < pedsCautionsDataList.Count; i++) {
                if (pedsCautionsDataList[i].StartsWith(name)) {
                    pedHasCautions = true;
                    List<string> pedsCautions = pedsCautionsDataList[i].Split('=')[1].Split(';').ToList();
                    pedsCautions.Add(message);
                    pedsCautionsDataList[i].Split('=')[1] = string.Join(";", pedsCautions);
                    break;
                }
            }

            if (!pedHasCautions) {
                pedsCautionsDataList.Add($"{name}={message}");
            }

            File.WriteAllText($"{Main.DataPath}/pedsCautions.data", string.Join(",", pedsCautionsDataList));
        }
    }
}
