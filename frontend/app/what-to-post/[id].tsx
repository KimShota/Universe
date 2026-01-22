import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

const WHAT_TO_POST_CONTENT: { [key: string]: string } = {
  'use-creator-universe': `**Use Creator Universe**

Your Creator Universe is your strategic foundation - the system that keeps your content focused, authentic, and aligned with who you are.

**The Three Components:**

**1. Vision Screen - Your Foundation**
This is where you define your **ethos** (your core message) and your **content pillars**.

- **Your Ethos**: One sentence that defines what you stand for
  - Example: "Studying shouldn't feel miserable"
  - Example: "Creators shouldn't feel alone"
  - This is your North Star - it rarely changes

- **Your Content Pillars**: 3-4 main themes you'll consistently create about
  - 3 pillars based on your interests/skills (these can evolve)
  - 1 story pillar (this never changes - it's your personal journey)
  - Each pillar should have multiple content ideas

**2. Audience Screen - Know Who You're Serving**
Understanding your audience is how you create content that actually matters to them.

- **Demographic**: Who are they?
  - Age range, location, profession, gender breakdown

- **Psychographic**: What do they need?
  - What struggles do they have?
  - What do they desire?
  - What creators do they already follow?

**Pro Tip**: Use the "Younger You Principle" - target the version of yourself from 2-3 years ago. You know exactly what they struggled with and desired.

**3. Edge Screen - What Makes You Unique**
Your uniqueness comes from three places:

- **Pain**: What challenges have you overcome?
  - This is where your most powerful content comes from
  - People connect through your humanity, not your highlights
  - Share your struggles, not just your successes

- **Passion**: What drives you?
  - What excites you? What makes you feel fulfilled?

- **Experience**: What have you learned?
  - Qualifications, milestones, who you've helped

- **Skill**: What can you teach?
  - What you're good at, mastered methods, go-to expertise

**How to Use It Daily:**

1. **Before Creating Content**: Check your Vision screen
   - Does this idea align with your ethos?
   - Which pillar does it fit into?

2. **When Stuck**: Review your Audience screen
   - What problem are you solving for them?
   - What transformation are you offering?

3. **For Authenticity**: Reference your Edge screen
   - How does your unique experience relate?
   - What pain can you share to connect?

**Remember**: Your Creator Universe grows with you. As you evolve, update it. But your ethos and story pillar remain your anchor.`,

  'how-to-develop-creator-universe': `**How to Develop Creator Universe**

Define your **ethos**, choose your **pillars**, and build a Universe that grows with you.

**Step 1: Define Your Message (Ethos)**

Your ethos is your core belief - the one sentence you stand for. This is the foundation of your Creator Universe and it rarely changes.

**What is an Ethos?**
- Your core belief about your topic
- One powerful sentence that defines you
- The message that drives everything you create
- This becomes your "why" - your reason for creating

**How to Find Your Ethos:**
Ask yourself: What do you fundamentally believe about your area of expertise?

**Examples:**
- "Studying shouldn't feel miserable."
- "Creators shouldn't feel alone."
- "Fitness should be accessible to everyone."
- "Learning can be fun and engaging."

**Remember**: Your ethos is your anchor. It's what you always come back to, even as your content evolves.

**Step 2: Choose Your Pillars**

Pillars are the main themes you'll consistently create content about. You need two types:

**Interest/Skill Pillars (3 pillars - can evolve)**
- These are topics you're passionate about or skilled in
- They can change as you grow and learn
- Examples: Fitness, Cooking, Travel, Business, Art
- Choose 3 that excite you right now

**Story Pillar (1 pillar - never changes)**
- This is your personal story or journey
- It's always relevant because it's uniquely yours
- Examples: "My journey from zero to 100K followers"
- "How I overcame [your challenge]"
- "My path to [your achievement]"

**Why Your Story Pillar Matters:**
Your story is what makes you relatable. People connect with your journey, struggles, and growth. This pillar never gets old because it's authentically you.

**Step 3: Accept Evolution**

Your Creator Universe is designed to grow with you, not hold you back.

**The Truth About Evolution:**
- Your interests WILL change - and that's okay
- Your skill pillars can evolve as you learn new things
- This isn't a mistake - it's the system working as intended
- Your Universe grows as **you grow**

**How to Evolve Gracefully:**
- When you lose interest in a pillar, replace it
- When you discover new passions, add them
- Keep your ethos and story pillar consistent
- Let your content reflect who you are NOW

**Remember**: The goal isn't to stay the same forever. The goal is to build a Universe that adapts with you while staying true to your core message.`,

  'treat-account-as-yourself': `**Treat Your Account as Yourself**

Your social media account is your personal brand - how the world perceives you. It should be an authentic extension of who you are, not a separate persona.

**Why This Matters:**

**Personal Brand = Your Greatest Asset**
- It allows you to attract opportunities (networking, brand deals, business)
- You don't have to chase them - they come to your inbox
- You become a magnet that people gravitate toward
- This is how entrepreneurship and creative work is headed - all personal branding

**The Reality:**
Everyone wants to be a creator. Everyone has thought about it. But if you actually act on this desire and succeed, it might make others feel bad about not starting. Remember: you'll never be judged by someone doing more than you - only by those doing less.

**How to Be Authentic:**

1. **Share Your Real Story**
   - Your actual struggles and pain points
   - Your genuine wins and transformations
   - Your authentic voice and personality
   - Don't just flex - connect through struggle

2. **Don't Create a Character**
   - You don't need to be "on" all the time
   - Show your real personality, quirks included
   - Be a peer, not just an expert
   - Journey POV > Expert POV (you're a few steps ahead, not miles ahead)

3. **Focus on Your Pain, Passion, and Pursuit**
   - **Pain**: What you've struggled with and overcome
   - **Passion**: What drives and excites you
   - **Pursuit**: What you're currently working toward
   - This makes you the niche - people are attracted to YOU

4. **Show Behind the Scenes**
   - Real moments, not just highlights
   - Your process of getting good at something
   - Document while you're learning
   - Your journey, not just your destination

**The Mindset Shift:**

Instead of: "I can't escape 200 view jail"
Think: "200 is a stadium full of fans"

Instead of: "I'm not special enough"
Think: "Shared struggles build the strongest connection"

Instead of: "I don't have expertise"
Think: "Document while you're learning"

**Remember**: People follow people, not personas. Your face should show up in your content. This is personal branding - be loud, proud, and bold about building something that aligns with you.`,

  'why-niching-down-not-good': `**Why Niching Down Is Not Good**

Traditional niching is dead. Here's why focusing on one topic limits your long-term success.

**The Three Core Problems:**

**1. You're Multi-Interested**
- If you pour into one topic alone, you'll be known for that one topic
- When you post outside that topic, your content doesn't get the same engagement
- This makes you feel stuck creating content that doesn't align with you

**2. You Will Evolve as a Human**
- If you're a student now, you won't be in several years
- If you're pursuing a specific business, you likely won't be in several years
- If you're single now, you may not be in several years
- You want your audience to match your journey, not hold you back

**3. You'll Get Bored**
- As a creator, the process is intimate - you go from inspiration to execution
- If you're posting the exact same content, you'll grow tiresome
- If you don't get bored, your audience will
- Content fatigue is real from the viewer's perspective

**The Better Approach: Become the Niche**

Instead of niching down into one topic, build your personal brand:

**Personal Brand = How the world perceives you**
- Your public reputation
- Your value system, beliefs, and opinions
- The ability to present exactly who you are and what you offer

**Why Personal Brand Wins:**
- People champion you as a person, not just your content
- You build a loyal audience that wants you to win
- You attract opportunities (business, networking, brand deals)
- You can experiment with various interests
- You become the niche itself

**The Solution: Find Your Ethos**

Your ethos is the message that connects your various interests.

**Example Ethos**: "More people should find financial freedom so they can spend time doing things they love"

This connects different pillars:
- Pillar 1: Financial tips
- Pillar 2: Business tips  
- Pillar 3: Relationship advice
- Pillar 4: Your story (how financial freedom transformed you)

**The Fourth Pillar: Your Story**

Your story pillar never changes. It's how your ethos has transformed you:
- How has pursuing this life impacted you?
- What pain did you experience?
- How did you overcome it?
- This is where your most powerful content comes from

**Remember**: Say this to yourself: "I am the niche." Your content pillars can evolve, but your ethos and story keep everything connected.`,

  'what-types-of-content': `**What Types of Content to Post**

Post at least 3 times per week. Here's the strategic mix that builds your community:

**The Three Core Content Types:**

**1. Storytelling Content**
This is how people connect with you authentically.

**What Makes Good Storytelling:**
- It doesn't have to be a massive transformation (0 to billionaire)
- It can be a simple mindset shift
- Examples: anxiety → peace, can't study → able to study
- Use Journey POV: treat yourself as a peer, not an expert
- You're a few steps ahead, not miles ahead

**The 3P Framework:**
- **Problem**: What struggle did you encounter?
- **Pursuit**: What actions did you take to overcome it?
- **Payoff**: What was the transformation and why was it meaningful?

**Why It Works:**
- People connect through struggle, not highlights
- When you lead with storytelling, you become approachable
- Your content feels human and people feel seen
- They stop championing just your tips and start championing YOU as a brand

**2. Value-Based Content**
This is where you teach insights based on your own experiences.

**How to Know If It's Valuable:**
Ask: Is this selfish or selfless content?
- **Selfless**: Thinking about the payoff for your audience
- **Selfish**: Only highlighting your genius (this makes people feel looked down upon)

**Types of Value Content:**
- Teaching one thing you actually know
- One technique, one decision, one key takeaway
- Breaking something down (3-step system, common mistake, mini framework)
- Walk-through steps

**3. Reach Content**
You need content optimized for attracting new eyeballs.

**How to Create Reach Content:**
- Combine trending formats with your message
- Use proven formats that work on the algorithm
- Examples: B-roll with text, split screen, trending sounds
- The format does the work, your insight builds credibility

**The Weekly Schedule (7 Days):**

**Day 1: High Effort - Build Trust**
- Your story, a real struggle, the shift you made, the lesson learned
- This makes people believe you

**Day 2: Low Effort - Build Relatability**
- Behind the scenes, day in the life, something real and unpolished
- This makes your content feel human

**Day 3: Medium Effort - Build Authority**
- Teach one thing you actually know
- One technique, one decision, one key takeaway
- Positions you as worth listening to

**Day 4: Low Effort - Build Reach**
- Trending format (B-roll with text, split screen)
- Pair it with your message
- Format does the work, your insight builds credibility

**Day 5: Medium Effort - Build Value**
- Break something down
- 3-step system, common mistake, mini framework
- This keeps people following you

**Day 6: Lowest Effort - Stay Consistent**
- Reflection, gratitude, answering a common question
- Helps you stay consistent on low-energy days

**Day 7: High Effort - Build Depth**
- Longer reel, mini lesson, short vlog
- Turns followers into a real community

**If Posting Less:**
- 6 days: Remove Day 6
- 5 days: Remove Day 2
- 4 days: Remove Day 3

**The 80/20 Rule:**
- 80% proven formats (what works)
- 20% experimentation (try new things)

**Remember**: Good content solves a real problem, is easy to understand, feels relevant and authentic, and aligns with a clear goal. Focus on selfless content that serves your audience.`,
};

export default function WhatToPostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const content = WHAT_TO_POST_CONTENT[id || ''] || 'Content not found.';
  const option = WHAT_TO_POST_OPTIONS.find((opt) => opt.id === id);

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {option?.title || 'What to Post'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.contentBox}>
            {content.split('\n').map((line, index) => {
              // Handle bold text (**text**)
              const parts: (string | JSX.Element)[] = [];
              let remaining = line;
              let keyIndex = 0;

              while (remaining.length > 0) {
                const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
                if (boldMatch) {
                  const beforeBold = remaining.substring(0, boldMatch.index);
                  if (beforeBold) {
                    parts.push(beforeBold);
                  }
                  parts.push(
                    <Text key={`bold-${index}-${keyIndex++}`} style={styles.boldText}>
                      {boldMatch[1]}
                    </Text>
                  );
                  remaining = remaining.substring((boldMatch.index || 0) + boldMatch[0].length);
                } else {
                  parts.push(remaining);
                  break;
                }
              }

              if (line.trim() === '') {
                return <View key={index} style={styles.emptyLine} />;
              }

              return (
                <Text key={index} style={styles.contentText}>
                  {parts}
                </Text>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const WHAT_TO_POST_OPTIONS = [
  {
    id: 'use-creator-universe',
    title: 'Use Creator Universe',
    icon: 'telescope-outline',
  },
  {
    id: 'how-to-develop-creator-universe',
    title: 'How to Develop Creator Universe',
    icon: 'rocket-outline',
  },
  {
    id: 'treat-account-as-yourself',
    title: 'Treat Your Account as Yourself',
    icon: 'person-outline',
  },
  {
    id: 'why-niching-down-not-good',
    title: 'Why Niching Down Is Not Good',
    icon: 'warning-outline',
  },
  {
    id: 'what-types-of-content',
    title: 'What Types of Content to Post',
    icon: 'list-outline',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  contentText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emptyLine: {
    height: 12,
  },
});
