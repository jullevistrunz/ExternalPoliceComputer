using Rage;
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
            List<string> pedsCautionsDataList = !string.IsNullOrEmpty(pedsCautionsData) ? pedsCautionsData.Split(',').ToList() : new List<string>();

            message = Main.MakeStringWorkWithMyStupidQueryStrings(message);

            bool pedHasCautions = false;
            
            for (int i = 0; i < pedsCautionsDataList.Count; i++) {
                if (pedsCautionsDataList[i].StartsWith(name)) {
                    pedHasCautions = true;
                    List<string> pedsCautions = pedsCautionsDataList[i].Split('=')[1].Split(';').ToList();
                    pedsCautions.Add(message);
                    pedsCautionsDataList[i] = $"{name}={string.Join(";", pedsCautions)}";
                    break;
                }
            }

            if (!pedHasCautions) {
                pedsCautionsDataList.Add($"{name}={message}");
            }

            File.WriteAllText($"{Main.DataPath}/pedsCautions.data", string.Join(",", pedsCautionsDataList));
        }


        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void AddCautionToCar(string licensePlate, string message) {
            string carsCautionsData = File.ReadAllText($"{Main.DataPath}/carsCautions.data");
            List<string> carsCautionsDataList = !string.IsNullOrEmpty(carsCautionsData) ? carsCautionsData.Split(',').ToList() : new List<string>();

            message = Main.MakeStringWorkWithMyStupidQueryStrings(message);

            bool carHasCautions = false;

            for (int i = 0; i < carsCautionsDataList.Count; i++) {
                if (carsCautionsDataList[i].StartsWith(licensePlate)) {
                    carHasCautions = true;
                    List<string> carsCautions = carsCautionsDataList[i].Split('=')[1].Split(';').ToList();
                    carsCautions.Add(message);
                    carsCautionsDataList[i] = $"{licensePlate}={string.Join(";", carsCautions)}";
                    break;
                }
            }

            if (!carHasCautions) {
                carsCautionsDataList.Add($"{licensePlate}={message}");
            }

            File.WriteAllText($"{Main.DataPath}/carsCautions.data", string.Join(",", carsCautionsDataList));
        }
    }
}
