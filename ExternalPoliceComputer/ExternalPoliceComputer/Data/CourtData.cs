using System.Collections.Generic;

namespace ExternalPoliceComputer.Data {
    public class CourtData {
        internal CourtData(string pedName, string number, int shortYear) {
            PedName = pedName;
            Number = number;
            ShortYear = shortYear;
        }

        public CourtData() { }

        public string PedName;
        public string Number;
        public int ShortYear;
        public List<Charge> Charges = new List<Charge>();

        public class Charge {
            internal Charge(string name, int fine, int? time) {
                Name = name;
                Fine = fine;
                Time = time;
            }

            public Charge() { }

            public string Name;
            public int Fine;
            public int? Time;
        }

        public void AddCharge(Charge charge) {
            Charges.Add(charge);
        }
    }
}
