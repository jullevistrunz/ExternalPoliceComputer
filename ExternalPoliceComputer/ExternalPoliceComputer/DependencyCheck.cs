using System;
using System.IO;
using System.Reflection;
using Rage;

namespace ExternalPoliceComputer {
    internal class DependencyCheck { 
        internal static bool IsCIAPIAvailable(string assemblyName = "CalloutInterfaceAPI")
        {
            try
            {
                var assembly = AssemblyName.GetAssemblyName($"{AppDomain.CurrentDomain.BaseDirectory}/{assemblyName}");
                Game.LogTrivial($"CalloutInterface dependency {assemblyName} does not meet minimum requirements.");
                return false;
            }
            catch (Exception ex) when (ex is FileNotFoundException || ex is BadImageFormatException)
            {
                Game.LogTrivial($"CalloutInterface dependency {assemblyName} is not available.");
                return false;
            }
        }

        internal static bool IsCIAvailable() {
            return CalloutInterfaceAPI.Functions.IsCalloutInterfaceAvailable;
        }
    }
}
