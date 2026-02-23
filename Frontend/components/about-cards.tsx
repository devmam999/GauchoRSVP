"use client";

import { Compass, Star, Users } from "lucide-react";
import { FlipCard } from "@/components/flip-card";

const features = [
  {
    icon: <Compass className="h-6 w-6 text-foreground" />,
    title: "Discover Events",
    frontDescription: (
      <ul className="flex flex-col gap-2 text-muted-foreground">
        <li>{"🎯 Events tailored to your interests"}</li>
        <li>{"🏫 Clubs, concerts, sports & more"}</li>
        <li>{"📅 Never miss what's happening on campus"}</li>
      </ul>
    ),
    backDescription: (
      <ul className="flex flex-col gap-3">
        <li>{"📝 Tell us what you're into when you sign up"}</li>
        <li>{"🤖 We'll recommend events you'll actually want to attend"}</li>
        <li>{"🔍 No more scrolling through flyers"}</li>
        <li>{"💎 Discover hidden gems you'd otherwise miss"}</li>
      </ul>
    ),
    borderColor: "border-red-500/60",
    delay: "0.3s",
  },
  {
    icon: <Star className="h-6 w-6 text-foreground" />,
    title: "Live Ratings",
    frontDescription: (
      <ul className="flex flex-col gap-2 text-muted-foreground">
        <li>{"⭐ Real-time ratings from students"}</li>
        <li>{"🗳️ See what others think before you go"}</li>
        <li>{"📊 Like Yelp, but for campus events"}</li>
      </ul>
    ),
    backDescription: (
      <ul className="flex flex-col gap-3">
        <li>{"✅ Not sure if it's worth it? No worries!"}</li>
        <li>{"⭐ Users rate events live as they happen"}</li>
        <li>{"💬 Read honest reviews from real attendees"}</li>
        <li>{"🎉 Make every night out count"}</li>
      </ul>
    ),
    borderColor: "border-green-500/60",
    delay: "0.45s",
  },
  {
    icon: <Users className="h-6 w-6 text-foreground" />,
    title: "See Your Friends",
    frontDescription: (
      <ul className="flex flex-col gap-2 text-muted-foreground">
        <li>{"👯 See which events your friends attend"}</li>
        <li>{"🤝 Friend request other users"}</li>
        <li>{"🎊 Never show up alone again"}</li>
      </ul>
    ),
    backDescription: (
      <ul className="flex flex-col gap-3">
        <li>{"➕ Send friend requests to other users"}</li>
        <li>{"👀 See what events they're going to"}</li>
        <li>{"📱 Coordinate plans effortlessly"}</li>
        <li>{"🙌 Make every event a group hangout"}</li>
      </ul>
    ),
    borderColor: "border-blue-500/60",
    delay: "0.6s",
  },
];

export function AboutCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {features.map((feature, index) => (
        <div
          key={feature.title}
          className={index === 2 ? "sm:col-span-2 sm:mx-auto sm:w-1/2" : ""}
        >
          <FlipCard {...feature} />
        </div>
      ))}
    </div>
  );
}
