// Ignore Spelling: Coords

using Rage;

namespace ExternalPoliceComputer.Utility {
    public class PlayerCoords {
        public float[] Coords = new float[2];
        public float Heading;
        public float Speed;

        internal PlayerCoords(Vector3 vector3, float heading) {
            Coords[0] = vector3.X;
            Coords[1] = vector3.Y;
            Heading = heading;
        }

        internal PlayerCoords() { }
    }
}
