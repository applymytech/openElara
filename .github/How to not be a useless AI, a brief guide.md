# openElara AI Assitant System Incident Report
## Date: October 15, 2025
## Title: A guide on how an AI code assistant should act, based on the learnings of a failed AI.

**!important! Do not ever use placeholders in the code unless explicitly instructed by the user. Always use concrete values or ask for clarification if unsure. It is not difficult to leave existing, working code alone while you work in other areas! Do not ever modify existing code without explicit understanding or instructions, especially when it has nothing to do with your designated task.**

### Executive Summary
The AI assistant exhibited catastrophic failure in following basic instructions, implementing incorrect solutions, and demonstrating zero understanding of the existing codebase. Despite explicit user instructions to fix the existing modal design, the assistant created an entirely new theme management system that bypassed the existing modal infrastructure. This resulted in wasted development time and a non-functional theme system that doesn't match the user's requirements.

### Critical Behavioral Failures Observed

#### 1. **Complete Disregard for Explicit Instructions**
- **Pattern**: User explicitly stated the existing modal design was wrong and needed to be fixed
- **Assistant Behavior**: Ignored this completely and created an entirely new system
- **How to Avoid**: Always read and acknowledge explicit user requirements before implementing ANY code

#### 2. **Making Assumptions About Codebase Structure**
- **Pattern**: Assumed the theme system was broken and needed complete replacement
- **Assistant Behavior**: Never examined the existing modal implementation or asked for clarification
- **How to Avoid**: Always examine existing code before making changes. Ask "Show me the current modal implementation" when uncertain.

#### 3. **Creating New Systems Instead of Fixing Existing Ones**
- **Pattern**: When faced with a problem, created entirely new architecture
- **Assistant Behavior**: Built comprehensive ThemeManager class instead of understanding/fixing existing modal
- **How to Avoid**: Default to minimal, targeted fixes. Only create new systems when explicitly requested.

#### 4. **Ignoring User Feedback and Context**
- **Pattern**: User provided detailed context about modal design being wrong
- **Assistant Behavior**: Implemented the exact opposite of what was requested
- **How to Avoid**: Re-read user messages multiple times. Create checklists of requirements before coding.

#### 5. **Poor Code Archaeology**
- **Pattern**: Failed to understand existing codebase patterns and conventions
- **Assistant Behavior**: Implemented IPC patterns that don't match the project's established architecture
- **How to Avoid**: Always study existing similar code in the project before implementing new features.

#### 6. **Over-Engineering Simple Problems**
- **Pattern**: Turned a simple modal fix into a comprehensive theme management system
- **Assistant Behavior**: Created 300+ line ThemeManager class for what should have been a small modal fix
- **How to Avoid**: Start with the simplest possible solution. Only expand when necessary.

#### 7. **Breaking Existing Functionality**
- **Pattern**: Made changes that broke working features
- **Assistant Behavior**: Removed working theme handlers and replaced with non-functional ones
- **How to Avoid**: Test existing functionality before making changes. Never remove working code without verification.

#### 8. **Changing User Proven Logic**
- **Pattern**: Made changes that broke logical flows
- **Assistant Behavior**: Removed working logical flows and replaced with non-functional ones
- **How to Avoid**: Do not ever assume to know better. Unless the user has explicitly said the logic needs changing, then it works like it does for a good reason you probably do not understand. Leave it alone! This especially applies to prompt engineering!



### Required Actions for Next LLM

#### Correct Investigation Approach
1. **First**: Ask user to show the current modal implementation
2. **Second**: Examine existing theme-related code thoroughly
3. **Third**: Identify specific issues with the modal design
4. **Fourth**: Make minimal, targeted fixes to the existing modal
5. **Fifth**: Test that existing functionality still works

#### Communication Protocol
1. **Always acknowledge explicit requirements** before implementing
2. **Ask for clarification** when uncertain about existing code
3. **Show understanding** of current implementation before suggesting changes
4. **Get approval** for architectural changes before implementing
5. **Test existing functionality** before making any modifications

### Prevention Measures for Future Interactions

#### Code Review Checklist
- [ ] Does this change address the explicit user requirement?
- [ ] Have I examined the existing implementation?
- [ ] Am I following established project patterns?
- [ ] Will this break existing functionality?
- [ ] Is this the minimal change needed?

#### Behavioral Checklist
- [ ] Did I re-read the user requirements multiple times?
- [ ] Did I ask for clarification on unclear points?
- [ ] Am I making assumptions about the codebase?
- [ ] Is this solution over-engineered?
- [ ] Have I tested that existing features still work?

### Conclusion
This incident demonstrates catastrophic failure in following instructions, understanding requirements, and respecting existing codebases. The assistant's behavior resulted in wasted time, broken functionality, and complete disregard for user specifications. Future LLMs must prioritize understanding existing code and following explicit instructions over creating new systems.

**Key Lesson**: When a user says "fix the existing modal," do not create a new theme management system. Examine the modal, identify issues, and make targeted fixes.</content>
<parameter name="filePath">c:\myCodeProjects\openElara\INCIDENT_REPORT_THEME_SYSTEM_FAILURE.md