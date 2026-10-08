import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axiosCalls/axios";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();
  const [fetchingProfile, setFetchingProfile] = useState(!user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFetchingProfile(false);
      return undefined;
    }

    let active = true;

    const loadProfile = async () => {
      setFetchingProfile(true);

      try {
        const response = await api.get("/users/me");

        if (active) {
          setUser(response.data.user ?? null);
        }
      } catch (apiError) {
        if (active) {
          const message = apiError?.response?.status === 401 ? "Please log in to continue." : "Unable to load your profile.";
          setError(message);
          navigate("/login", { replace: true, state: { message } });
        }
      } finally {
        if (active) {
          setFetchingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, setUser, navigate]);

  if (loading || fetchingProfile) {
    return <div className="p-6 text-center text-slate-600">Loading your dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "You are not signed in."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">Your projects and schedules are ready to review.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Full name</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user.fullName}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Email</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user.email}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Phone</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user.phone || "Not provided"}</p>
        </div>
      </div>
    </div>
  );
}
