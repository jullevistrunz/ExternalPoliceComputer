using System.IO;

namespace ExternalPoliceComputer {
    internal class DependencyCheck {
        internal static bool IsCIAPIAvailable() {
            return File.Exists("CalloutInterfaceAPI.dll");
        }

        internal static bool IsCIAvailable() {
            return CalloutInterfaceAPI.Functions.IsCalloutInterfaceAvailable;
        }
    }
}
