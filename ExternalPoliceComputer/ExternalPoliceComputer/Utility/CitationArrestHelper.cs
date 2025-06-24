using ExternalPoliceComputer.Setup;
using System;
using System.Collections.Generic;
using System.Linq;
namespace ExternalPoliceComputer.Utility {
    internal class CitationArrestHelper {
        private static Random random = new Random();

        internal static CitationGroup.Charge GetRandomCitationCharge() {
            List<CitationGroup.Charge> allCharges = SetupController.GetCitationOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .ToList();
            if (allCharges.Count == 0) return null;
            return allCharges[random.Next(allCharges.Count)];
        }

        internal static ArrestGroup.Charge GetRandomArrestCharge() {
            List<ArrestGroup.Charge> allCharges = SetupController.GetArrestOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .ToList();
            if (allCharges.Count == 0) return null;
            return allCharges[random.Next(allCharges.Count)];
        }

        internal static ArrestGroup.Charge GetRandomWarrantCharge() {
            List<ArrestGroup.Charge> allCharges = SetupController.GetArrestOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .Where(charge => charge.canBeWarrant)
                .ToList();
            if (allCharges.Count == 0) return null;
            return allCharges[random.Next(allCharges.Count)];
        }

        internal static CitationGroup.Charge GetRandomLicenseRevokeCharge() {
            List<CitationGroup.Charge> citationCharges = SetupController.GetCitationOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .Where(charge => charge.canRevokeLicense)
                .ToList();


            List<CitationGroup.Charge> arrestCharges = SetupController.GetArrestOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .Where(charge => charge.canRevokeLicense)
                .Cast<CitationGroup.Charge>()
                .ToList();

            List<CitationGroup.Charge> allCharges = citationCharges.Concat(arrestCharges).ToList();

            if (allCharges.Count == 0) return null;
            return allCharges[random.Next(allCharges.Count)];
        }

        internal static List<CitationGroup.Charge> GetRandomCitationCharges(int maxCount) {
            List<CitationGroup.Charge> allCharges = SetupController.GetCitationOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .ToList();

            if (allCharges.Count == 0) return new List<CitationGroup.Charge>();

            int count = random.Next(0, Math.Min(maxCount, allCharges.Count) + 1);
            return allCharges.OrderBy(_ => random.Next()).Take(count).ToList();
        }

        internal static List<ArrestGroup.Charge> GetRandomArrestCharges(int maxCount) {
            List<ArrestGroup.Charge> allCharges = SetupController.GetArrestOptions()
                .Where(group => group.charges != null && group.charges.Count > 0)
                .SelectMany(group => group.charges)
                .ToList();

            if (allCharges.Count == 0) return new List<ArrestGroup.Charge>();

            int count = random.Next(0, Math.Min(maxCount, allCharges.Count) + 1);
            return allCharges.OrderBy(_ => random.Next()).Take(count).ToList();
        }

        internal static bool SelectWithProbability(float probability) {
            return random.NextDouble() < probability;
        }
    }
}
