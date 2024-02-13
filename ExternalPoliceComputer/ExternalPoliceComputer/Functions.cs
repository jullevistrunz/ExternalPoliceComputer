using System.Collections.Specialized;
using System.IO;
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
    }
}
