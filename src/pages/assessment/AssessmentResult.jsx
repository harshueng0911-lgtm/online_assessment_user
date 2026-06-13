import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";
import ProgressBar from "../../components/common/ProgressBar.jsx";

export default function AssessmentResult() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        const { data, error } =
          await supabase
            .from("assessment_attempts")
            .select("*")
            .eq("assessment_id", id)
            .eq("user_id", user.id)
            .order("started_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        // If the attempt is still in progress (e.g. user got
        // disconnected before submitting), send them back into the
        // assessment to resume instead of showing an empty result.
        if (data && data.status !== "completed") {
          navigate(`/assessments/${id}/attempt`, { replace: true });
          return;
        }

        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadResult();
    }
  }, [id, user]);

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading Result...
    </div>
  );
}
if (!result) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Result not found
    </div>
  );
}

  const score = result
    ? Math.round(
        (result.score /
          result.total_questions) *
          100
      )
    : 0;

const sections = [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-brand-700 text-white p-10 text-center"
      >
        <Trophy className="h-12 w-12 mx-auto" />
        <h1 className="mt-4 text-3xl font-display font-bold">Assessment Submitted</h1>
        <p className="mt-1 text-white/80">Assessment completed successfully</p>
        <div className="mt-8 inline-flex flex-col items-center">
          <p className="text-6xl font-display font-bold"> {result?.score}/{result?.total_questions}</p>
          <p className="text-sm text-white/80 mt-1"> Percentage: {score}%</p>
        </div>
      </motion.div>


      <div className="flex justify-end">
        <Link to="/dashboard" className="btn-primary">
          Back to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
