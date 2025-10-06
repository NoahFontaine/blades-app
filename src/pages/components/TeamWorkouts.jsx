import TeamPastWorkouts from "./teamWorkoutComponents/TeamPastWorkouts";

export default function TeamWorkouts({ signInUser, role }) {
  return <TeamPastWorkouts signInUser={signInUser} role={role} />;
}
