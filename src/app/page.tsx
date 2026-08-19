import { QuizBuilder } from "@/components/quiz-builder";

export default function HomePage() {
  return <div className="page home"><section className="hero"><p className="eyebrow">Video learning, made personal</p><h1>Turn a YouTube video into a quiz that fits the learner.</h1><p>Start in English by default, adjust the target age, and keep every answer ready for review.</p></section><QuizBuilder /></div>;
}
