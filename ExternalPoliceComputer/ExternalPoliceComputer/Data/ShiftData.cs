using System;
using System.Collections.Generic;

namespace ExternalPoliceComputer.Data {
    public class ShiftData {
        public DateTime? startTime = null;
        public DateTime? endTime = null;
        public List<string> reports = new List<string>();
    }
}
