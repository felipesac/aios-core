# Design Project Workflow

> End-to-end workflow for design projects orchestrated by Design Chief
> Version: 1.0.0
> Type: Sequential with parallel options

---

## Workflow Overview

```yaml
workflow:
  id: "design-project-workflow"
  name: "Design Project End-to-End"
  description: |
    Complete workflow for design projects: intake, specialist assignment,
    execution, review, revision cycles, and final delivery. Orchestrated
    by Design Chief with routing to 9 specialist agents based on project type.
  version: "1.0.0"
  type: "orchestrated"
  owner: "@design-chief"

metadata:
  author: "Design Chief (Design Squad Orchestrator)"
  created_date: "2026-02-02"
  last_modified: "2026-02-02"
  tags:
    - design-squad
    - orchestration
    - multi-agent
    - project-management
    - design-chief
  estimated_duration: "1 day - 8 weeks (depending on project scope)"
  complexity: "variable"
```

---

## Workflow Phases

### Phase 0: Workflow Initialization

**Purpose:** Set up workflow tracking and project infrastructure.

```yaml
phase_0:
  id: "initialization"
  name: "Workflow Initialization"
  duration: "5-10 minutes"
  agent: "@design-chief"

  steps:
    - id: "init_01"
      name: "Create Project Record"
      action: "create_project_record"
      inputs:
        project_name: "{{user.project_name}}"
        project_type: "{{pending_classification}}"
        requestor: "{{user.id}}"
      outputs:
        project_id: "string"
        project_folder: "path"
      validation:
        - "Project ID generated"
        - "Project folder created"

    - id: "init_02"
      name: "Initialize Session State"
      action: "initialize_state"
      inputs:
        project_id: "{{init_01.project_id}}"
      outputs:
        state_file: "path"
        session_id: "string"
      validation:
        - "State file created"
        - "Session ID assigned"

    - id: "init_03"
      name: "Log Project Start"
      action: "log_event"
      inputs:
        event_type: "PROJECT_START"
        project_id: "{{init_01.project_id}}"
        timestamp: "{{now}}"
      validation:
        - "Event logged"

  checkpoint:
    name: "Initialization Complete"
    criteria:
      - "Project record exists"
      - "State tracking active"
      - "Logging operational"
    on_failure: "abort_workflow"
```

---

### Phase 1: Intake and Triage

**Purpose:** Understand the request and classify it for appropriate routing.

```yaml
phase_1:
  id: "intake_triage"
  name: "Intake and Triage"
  duration: "10-30 minutes"
  agent: "@design-chief"

  steps:
    - id: "intake_01"
      name: "Receive Design Request"
      action: "receive_request"
      description: |
        Capture the user's design request verbatim along with any initial
        context they provide. This is the foundation for all subsequent work.
      inputs:
        request_text: "{{user.request}}"
        attachments: "{{user.attachments}}"
        initial_context: "{{user.context}}"
      outputs:
        raw_request:
          text: "string"
          attachments: "array"
          received_at: "timestamp"
      validation:
        - "Request text captured"
        - "Attachments indexed (if any)"

    - id: "intake_02"
      name: "Extract Keywords and Intent"
      action: "analyze_request"
      description: |
        Parse the request for routing keywords and primary intent.
        Match against the Design Squad's routing matrix.
      inputs:
        request: "{{intake_01.raw_request}}"
      outputs:
        keywords_matched:
          brand: "array"
          system: "array"
          visual: "array"
          photo: "array"
          business: "array"
        primary_intent: "string"
        confidence: "number"
      validation:
        - "At least one keyword category matched OR marked ambiguous"
        - "Primary intent extracted"

    - id: "intake_03"
      name: "Assess Complexity"
      action: "assess_complexity"
      description: |
        Evaluate project complexity across scope, specialist requirements,
        and timeline pressure to inform routing and estimation.
      inputs:
        request: "{{intake_01.raw_request}}"
        keywords: "{{intake_02.keywords_matched}}"
      outputs:
        complexity_score:
          scope: "1-3"
          specialists: "1-3"
          timeline: "1-3"
          overall: "1.0-3.0"
        complexity_level: "simple | moderate | complex"
      validation:
        - "Complexity score calculated"
        - "Level assigned"

    - id: "intake_04"
      name: "Classify Request Type"
      action: "classify_request"
      description: |
        Assign the request to exactly one classification type based on
        keywords, intent, and complexity assessment.
      inputs:
        keywords: "{{intake_02.keywords_matched}}"
        intent: "{{intake_02.primary_intent}}"
        complexity: "{{intake_03.complexity_level}}"
      outputs:
        classification:
          type: "BRAND_STRATEGY | VISUAL_IDENTITY | DESIGN_SYSTEM | YOUTUBE_VISUAL | PHOTOGRAPHY | PHOTO_VIDEO_EDITING | DESIGN_BUSINESS | DESIGN_OPERATIONS | MULTI_DOMAIN"
          confidence: "number"
          requires_clarification: "boolean"
      validation:
        - "Single classification assigned"
        - "Confidence above threshold OR clarification flagged"

    - id: "intake_05"
      name: "Clarification Loop (If Needed)"
      action: "clarify_request"
      condition: "{{intake_04.classification.requires_clarification}} == true"
      description: |
        If classification confidence is low or request is ambiguous,
        gather additional context through targeted questions.
      inputs:
        current_classification: "{{intake_04.classification}}"
        gaps_identified: "{{intake_04.gaps}}"
      outputs:
        clarification_responses: "object"
        updated_classification: "object"
      loop:
        max_iterations: 2
        exit_condition: "classification.confidence >= 0.8"
      validation:
        - "Clarification complete"
        - "Classification confidence improved"

  checkpoint:
    name: "Triage Complete"
    criteria:
      - "Request classified with confidence >= 0.8"
      - "Complexity assessed"
      - "All ambiguities resolved"
    on_failure: "escalate_to_user"

  outputs:
    classification_result:
      type: "{{intake_04.classification.type}}"
      confidence: "{{intake_04.classification.confidence}}"
      complexity: "{{intake_03.complexity_level}}"
      keywords: "{{intake_02.keywords_matched}}"
```

---

### Phase 2: Specialist Assignment

**Purpose:** Route the project to the appropriate specialist(s) based on classification.

```yaml
phase_2:
  id: "specialist_assignment"
  name: "Specialist Assignment"
  duration: "5-15 minutes"
  agent: "@design-chief"

  steps:
    - id: "assign_01"
      name: "Determine Primary Specialist"
      action: "route_to_specialist"
      description: |
        Based on classification, identify the primary specialist agent
        who will lead the execution phase.
      inputs:
        classification: "{{phase_1.classification_result}}"
      outputs:
        primary_specialist:
          agent: "string"
          tier: "0 | 1 | 2"
          expertise_match: "string"
          reason: "string"
      routing_matrix:
        BRAND_STRATEGY:
          agent: "@marty-neumeier"
          tier: 0
          reason: "Brand Gap methodology, Zag differentiation"
        VISUAL_IDENTITY:
          agent: "@aaron-draplin"
          tier: 2
          reason: "Logo design master, DDC, Field Notes"
        DESIGN_SYSTEM:
          agent: "@brad-frost"
          tier: 2
          reason: "Atomic Design inventor"
        YOUTUBE_VISUAL:
          agent: "@paddy-galloway"
          tier: 1
          reason: "YouTube CTR optimization, MrBeast consultant"
        PHOTOGRAPHY:
          agent: "@joe-mcnally"
          tier: 1
          reason: "Flash photography and lighting master"
        PHOTO_VIDEO_EDITING:
          agent: "@peter-mckinnon"
          tier: 2
          reason: "Lightroom, color grading, preset creation"
        DESIGN_BUSINESS:
          agent: "@chris-do"
          tier: 1
          reason: "Value-based pricing, The Futur"
        DESIGN_OPERATIONS:
          agent: "@dave-malouf"
          tier: 0
          reason: "DesignOps Handbook, team scaling"
        MULTI_DOMAIN:
          agent: "WORKFLOW_SELECTION"
          tier: "varies"
          reason: "Requires multi-specialist workflow"
      validation:
        - "Primary specialist identified"
        - "Routing reason documented"

    - id: "assign_02"
      name: "Identify Secondary Specialists (If Multi-Domain)"
      action: "plan_workflow"
      condition: "{{assign_01.primary_specialist.agent}} == 'WORKFLOW_SELECTION'"
      description: |
        For multi-domain projects, select the appropriate workflow pattern
        and identify all specialists who will participate.
      inputs:
        classification: "{{phase_1.classification_result}}"
        complexity: "{{phase_1.complexity}}"
      outputs:
        workflow_pattern:
          id: "string"
          name: "string"
          specialists: "array"
          phases: "array"
        specialist_sequence:
          - agent: "string"
            phase: "string"
            handoff_to: "string"
      workflow_patterns:
        FULL_REBRAND:
          id: "full_rebrand"
          specialists: ["@marty-neumeier", "@aaron-draplin", "@brad-frost"]
          phases: ["Strategy", "Logo", "System"]
        YOUTUBE_OPTIMIZATION:
          id: "youtube_opt"
          specialists: ["@paddy-galloway", "@peter-mckinnon"]
          phases: ["Strategy", "Execution"]
        PHOTOGRAPHY_PRODUCTION:
          id: "photo_prod"
          specialists: ["@joe-mcnally", "@peter-mckinnon"]
          phases: ["Capture", "Edit"]
        DESIGN_SCALING:
          id: "design_scaling"
          specialists: ["@dave-malouf", "@brad-frost"]
          phases: ["Operations", "System"]
        BRAND_TO_SYSTEM:
          id: "brand_to_system"
          specialists: ["@marty-neumeier", "@brad-frost"]
          phases: ["Strategy", "System"]
      validation:
        - "Workflow pattern selected (if multi-domain)"
        - "All specialists identified"
        - "Sequence defined"

    - id: "assign_03"
      name: "Generate Routing Recommendation"
      action: "generate_recommendation"
      description: |
        Create a clear recommendation for the user explaining which
        specialist(s) will handle the project and why.
      inputs:
        primary: "{{assign_01.primary_specialist}}"
        workflow: "{{assign_02.workflow_pattern}}"
        classification: "{{phase_1.classification_result}}"
      outputs:
        recommendation:
          summary: "string"
          primary_specialist: "object"
          workflow_pattern: "object (if multi)"
          estimated_duration: "string"
          justification: "string"
      validation:
        - "Recommendation generated"
        - "Justification included"

    - id: "assign_04"
      name: "Present Options (If Ambiguous)"
      action: "present_options"
      condition: "{{multiple_valid_routes}} == true"
      description: |
        If multiple specialists could handle the work, present numbered
        options to the user and await their selection.
      inputs:
        valid_routes: "array"
        recommendation: "{{assign_03.recommendation}}"
      outputs:
        options_presented: "array"
        user_selection: "string"
      validation:
        - "Options clearly presented"
        - "User selection received"

    - id: "assign_05"
      name: "Confirm Routing with User"
      action: "confirm_routing"
      description: |
        Before initiating handoff, confirm the routing decision with the user.
      inputs:
        recommendation: "{{assign_03.recommendation}}"
        user_selection: "{{assign_04.user_selection}}"
      outputs:
        routing_confirmed: "boolean"
        final_assignment:
          primary: "string"
          secondary: "array"
          workflow: "string"
      validation:
        - "User confirms routing"
        - "Final assignment recorded"

  checkpoint:
    name: "Assignment Complete"
    criteria:
      - "Primary specialist assigned"
      - "Workflow defined (if multi-domain)"
      - "User confirmed routing"
    on_failure: "return_to_triage"

  outputs:
    assignment_result:
      primary_specialist: "{{assign_05.final_assignment.primary}}"
      secondary_specialists: "{{assign_05.final_assignment.secondary}}"
      workflow_pattern: "{{assign_05.final_assignment.workflow}}"
      confirmed: "{{assign_05.routing_confirmed}}"
```

---

### Phase 3: Handoff and Context Transfer

**Purpose:** Transfer all necessary context to the assigned specialist(s).

```yaml
phase_3:
  id: "handoff"
  name: "Handoff and Context Transfer"
  duration: "10-20 minutes"
  agent: "@design-chief"

  steps:
    - id: "handoff_01"
      name: "Compile Handoff Brief"
      action: "create_handoff_brief"
      description: |
        Compile all information gathered during intake and triage into
        a structured brief for the receiving specialist.
      inputs:
        raw_request: "{{phase_1.raw_request}}"
        classification: "{{phase_1.classification_result}}"
        assignment: "{{phase_2.assignment_result}}"
        clarifications: "{{phase_1.clarification_responses}}"
      outputs:
        handoff_brief:
          project:
            id: "string"
            name: "string"
            type: "string"
          context:
            original_request: "string"
            objective: "string"
            success_criteria: "array"
            constraints:
              timeline: "string"
              technical: "string"
              budget: "string"
          deliverables:
            expected: "array"
            format: "array"
          background:
            business_context: "string"
            audience: "string"
            existing_brand: "string"
          notes:
            user_preferences: "string"
            warnings: "array"
      validation:
        - "Brief complete"
        - "All sections populated"

    - id: "handoff_02"
      name: "Validate Handoff Checklist"
      action: "validate_checklist"
      description: |
        Run through the design-handoff-checklist to ensure no critical
        information is missing before transfer.
      inputs:
        brief: "{{handoff_01.handoff_brief}}"
      outputs:
        checklist_status:
          sections_passed: "array"
          sections_failed: "array"
          overall: "PASS | FAIL"
          gaps: "array"
      validation:
        - "Checklist executed"
        - "All critical sections pass"

    - id: "handoff_03"
      name: "Resolve Checklist Gaps"
      action: "resolve_gaps"
      condition: "{{handoff_02.checklist_status.overall}} == 'FAIL'"
      description: |
        If checklist validation fails, gather missing information
        before proceeding with handoff.
      inputs:
        gaps: "{{handoff_02.checklist_status.gaps}}"
      outputs:
        gap_resolutions: "array"
        updated_brief: "object"
      loop:
        max_iterations: 2
        exit_condition: "checklist_status.overall == 'PASS'"
      validation:
        - "All gaps resolved"
        - "Checklist passes"

    - id: "handoff_04"
      name: "Transfer Context to Specialist"
      action: "execute_handoff"
      description: |
        Formally transfer the project to the assigned specialist,
        activating their context with the compiled brief.
      inputs:
        specialist: "{{phase_2.assignment_result.primary_specialist}}"
        brief: "{{handoff_01.handoff_brief}}"
        project_id: "{{phase_0.project_id}}"
      outputs:
        handoff_complete: "boolean"
        specialist_activated: "boolean"
        handoff_record:
          timestamp: "timestamp"
          from: "@design-chief"
          to: "string"
          brief_hash: "string"
      validation:
        - "Handoff executed"
        - "Specialist activated"

    - id: "handoff_05"
      name: "Confirm Specialist Receipt"
      action: "confirm_receipt"
      description: |
        Verify the specialist has received and understood the brief.
      inputs:
        specialist: "{{phase_2.assignment_result.primary_specialist}}"
        handoff_record: "{{handoff_04.handoff_record}}"
      outputs:
        receipt_confirmed: "boolean"
        specialist_questions: "array"
        clarification_needed: "boolean"
      validation:
        - "Specialist confirms receipt"
        - "Initial questions captured"

    - id: "handoff_06"
      name: "Address Specialist Questions"
      action: "answer_questions"
      condition: "{{handoff_05.clarification_needed}} == true"
      description: |
        If the specialist has questions, facilitate answers either from
        the user or from Design Chief's context.
      inputs:
        questions: "{{handoff_05.specialist_questions}}"
      outputs:
        answers_provided: "array"
        updated_context: "object"
      validation:
        - "All questions answered"
        - "Specialist ready to begin"

  checkpoint:
    name: "Handoff Complete"
    criteria:
      - "Brief validated against checklist"
      - "Specialist received and acknowledged"
      - "All questions resolved"
    on_failure: "retry_handoff"

  outputs:
    handoff_result:
      brief: "{{handoff_01.handoff_brief}}"
      specialist: "{{phase_2.assignment_result.primary_specialist}}"
      confirmed: "{{handoff_05.receipt_confirmed}}"
      timestamp: "{{handoff_04.handoff_record.timestamp}}"
```

---

### Phase 4: Execution

**Purpose:** Specialist executes the design work according to the brief.

```yaml
phase_4:
  id: "execution"
  name: "Specialist Execution"
  duration: "Variable (1 day - 6 weeks depending on scope)"
  agent: "{{assigned_specialist}}"
  orchestrator: "@design-chief"

  steps:
    - id: "exec_01"
      name: "Specialist Work Initiation"
      action: "begin_execution"
      description: |
        Specialist begins work according to their domain methodology.
        Design Chief monitors but does not interfere with specialist's process.
      inputs:
        brief: "{{phase_3.handoff_result.brief}}"
        specialist: "{{phase_3.handoff_result.specialist}}"
      outputs:
        execution_started: "boolean"
        estimated_completion: "timestamp"
        milestone_schedule: "array"
      validation:
        - "Work commenced"
        - "Timeline established"

    - id: "exec_02"
      name: "Progress Checkpoints"
      action: "monitor_progress"
      description: |
        Design Chief checks progress at defined intervals or milestones.
        Intervention only if blocked or off-track.
      inputs:
        milestone_schedule: "{{exec_01.milestone_schedule}}"
        specialist: "{{phase_3.handoff_result.specialist}}"
      outputs:
        progress_reports: "array"
        status: "on_track | delayed | blocked"
        blockers: "array"
      checkpoints:
        - type: "time_based"
          interval: "daily for short projects, weekly for long"
        - type: "milestone_based"
          events: ["draft_complete", "revision_complete", "final"]
      validation:
        - "Progress tracked"
        - "Blockers identified (if any)"

    - id: "exec_03"
      name: "Blocker Resolution"
      action: "resolve_blockers"
      condition: "{{exec_02.status}} == 'blocked'"
      description: |
        If specialist encounters blockers, Design Chief facilitates
        resolution through user communication or resource provision.
      inputs:
        blockers: "{{exec_02.blockers}}"
        specialist: "{{phase_3.handoff_result.specialist}}"
      outputs:
        resolutions: "array"
        status_updated: "string"
      validation:
        - "Blockers resolved"
        - "Work resumed"

    - id: "exec_04"
      name: "Interim Deliverable Check"
      action: "check_interim"
      condition: "{{project_complexity}} == 'complex'"
      description: |
        For complex projects, review interim deliverables before
        proceeding to ensure alignment with brief.
      inputs:
        interim_deliverable: "object"
        brief: "{{phase_3.handoff_result.brief}}"
      outputs:
        alignment_check:
          aligned: "boolean"
          gaps: "array"
          feedback: "string"
      validation:
        - "Interim reviewed"
        - "Direction confirmed or corrected"

    - id: "exec_05"
      name: "Deliverable Completion"
      action: "receive_deliverable"
      description: |
        Specialist completes work and submits deliverable for review.
      inputs:
        specialist: "{{phase_3.handoff_result.specialist}}"
        expected_deliverables: "{{phase_3.handoff_result.brief.deliverables}}"
      outputs:
        completed_deliverable:
          files: "array"
          documentation: "object"
          specialist_notes: "string"
        completion_timestamp: "timestamp"
      validation:
        - "Deliverable received"
        - "All expected items included"

  checkpoint:
    name: "Execution Complete"
    criteria:
      - "All expected deliverables submitted"
      - "Documentation included"
      - "Specialist sign-off received"
    on_failure: "extend_execution_or_escalate"

  outputs:
    execution_result:
      deliverable: "{{exec_05.completed_deliverable}}"
      specialist: "{{phase_3.handoff_result.specialist}}"
      completion_time: "{{exec_05.completion_timestamp}}"
      blockers_encountered: "{{exec_02.blockers}}"
```

---

### Phase 5: Review

**Purpose:** Multi-agent review of the completed deliverable.

```yaml
phase_5:
  id: "review"
  name: "Design Review"
  duration: "30-60 minutes"
  agent: "@design-chief"
  task: "design-review-orchestration"

  steps:
    - id: "review_01"
      name: "Prepare Review"
      action: "setup_review"
      description: |
        Identify reviewers based on deliverable type and prepare
        review brief with success criteria.
      inputs:
        deliverable: "{{phase_4.execution_result.deliverable}}"
        deliverable_type: "{{phase_1.classification_result.type}}"
        original_brief: "{{phase_3.handoff_result.brief}}"
        creating_specialist: "{{phase_4.execution_result.specialist}}"
      outputs:
        review_setup:
          lead_reviewer: "string"
          secondary_reviewers: "array"
          review_brief: "object"
          review_depth: "quick | standard | comprehensive"
      validation:
        - "Reviewers identified"
        - "Review brief prepared"

    - id: "review_02"
      name: "Execute Lead Review"
      action: "lead_review"
      description: |
        Lead reviewer (domain expert) provides detailed assessment
        of the deliverable against success criteria.
      inputs:
        reviewer: "{{review_01.review_setup.lead_reviewer}}"
        deliverable: "{{phase_4.execution_result.deliverable}}"
        brief: "{{review_01.review_setup.review_brief}}"
      outputs:
        lead_review:
          status: "APPROVED | APPROVED_WITH_NOTES | NEEDS_REVISION | REJECTED"
          confidence: "number"
          feedback: "object"
          blocking_issues: "array"
      validation:
        - "Lead review complete"
        - "Status assigned"

    - id: "review_03"
      name: "Execute Secondary Reviews"
      action: "secondary_reviews"
      parallel: true
      description: |
        Secondary reviewers provide focused feedback from their
        domain perspectives.
      inputs:
        reviewers: "{{review_01.review_setup.secondary_reviewers}}"
        deliverable: "{{phase_4.execution_result.deliverable}}"
        brief: "{{review_01.review_setup.review_brief}}"
        lead_summary: "{{review_02.lead_review}}"
      outputs:
        secondary_reviews: "array"
      validation:
        - "All secondary reviews collected"

    - id: "review_04"
      name: "Synthesize Feedback"
      action: "synthesize_reviews"
      description: |
        Consolidate all review feedback, identify consensus and conflicts,
        prioritize issues by severity.
      inputs:
        lead_review: "{{review_02.lead_review}}"
        secondary_reviews: "{{review_03.secondary_reviews}}"
      outputs:
        synthesis:
          overall_status: "string"
          confidence_score: "number"
          consensus_areas: "array"
          conflict_areas: "array"
          issues:
            critical: "array"
            major: "array"
            minor: "array"
      validation:
        - "Feedback synthesized"
        - "Issues prioritized"

    - id: "review_05"
      name: "Resolve Conflicts"
      action: "resolve_conflicts"
      condition: "{{review_04.synthesis.conflict_areas.length}} > 0"
      description: |
        If reviewers have conflicting feedback, Design Chief facilitates
        resolution through mediation or escalation.
      inputs:
        conflicts: "{{review_04.synthesis.conflict_areas}}"
        lead_review: "{{review_02.lead_review}}"
      outputs:
        resolutions: "array"
        escalated: "array"
      validation:
        - "Conflicts resolved or escalated"

    - id: "review_06"
      name: "Generate Review Report"
      action: "create_report"
      description: |
        Create comprehensive review report with executive summary,
        detailed feedback, and next steps.
      inputs:
        synthesis: "{{review_04.synthesis}}"
        resolutions: "{{review_05.resolutions}}"
        original_brief: "{{phase_3.handoff_result.brief}}"
      outputs:
        review_report:
          executive_summary: "object"
          detailed_feedback: "object"
          revision_checklist: "array"
          next_steps: "string"
      validation:
        - "Report generated"
        - "Next steps clear"

  checkpoint:
    name: "Review Complete"
    criteria:
      - "All reviewers participated"
      - "Feedback synthesized"
      - "Conflicts resolved"
      - "Report generated"
    decision_point:
      APPROVED: "proceed_to_delivery"
      APPROVED_WITH_NOTES: "proceed_to_delivery_with_notes"
      NEEDS_REVISION: "return_to_execution"
      REJECTED: "escalate_or_restart"

  outputs:
    review_result:
      status: "{{review_04.synthesis.overall_status}}"
      confidence: "{{review_04.synthesis.confidence_score}}"
      report: "{{review_06.review_report}}"
      revision_needed: "boolean"
```

---

### Phase 6: Revision (If Needed)

**Purpose:** Address review feedback through targeted revisions.

```yaml
phase_6:
  id: "revision"
  name: "Revision Cycle"
  duration: "Variable (based on revision scope)"
  condition: "{{phase_5.review_result.status}} == 'NEEDS_REVISION'"
  agent: "{{original_specialist}}"
  orchestrator: "@design-chief"

  steps:
    - id: "revision_01"
      name: "Communicate Revision Requirements"
      action: "send_revision_brief"
      description: |
        Send the revision checklist to the creating specialist
        with clear instructions on what needs to change.
      inputs:
        specialist: "{{phase_4.execution_result.specialist}}"
        revision_checklist: "{{phase_5.review_result.report.revision_checklist}}"
        review_report: "{{phase_5.review_result.report}}"
      outputs:
        revision_brief_sent: "boolean"
        specialist_acknowledged: "boolean"
        estimated_revision_time: "string"
      validation:
        - "Revision requirements communicated"
        - "Specialist acknowledged"

    - id: "revision_02"
      name: "Specialist Revision Work"
      action: "execute_revisions"
      description: |
        Specialist addresses each item in the revision checklist.
      inputs:
        revision_checklist: "{{phase_5.review_result.report.revision_checklist}}"
        original_deliverable: "{{phase_4.execution_result.deliverable}}"
      outputs:
        revised_deliverable:
          files: "array"
          changes_made: "array"
          items_addressed: "array"
        revision_notes: "string"
      validation:
        - "All critical items addressed"
        - "Changes documented"

    - id: "revision_03"
      name: "Verify Revisions"
      action: "verify_changes"
      description: |
        Verify that revisions address the feedback without introducing
        new issues.
      inputs:
        original_issues: "{{phase_5.review_result.report.revision_checklist}}"
        revised_deliverable: "{{revision_02.revised_deliverable}}"
      outputs:
        verification:
          items_resolved: "array"
          items_remaining: "array"
          new_issues: "array"
        status: "resolved | partial | failed"
      validation:
        - "Verification complete"
        - "Status determined"

    - id: "revision_04"
      name: "Re-Review (If Significant Changes)"
      action: "re_review"
      condition: "{{revision_scope}} == 'major'"
      description: |
        For major revisions, trigger abbreviated re-review focused
        on changed areas.
      inputs:
        revised_deliverable: "{{revision_02.revised_deliverable}}"
        focus_areas: "{{revision_02.changes_made}}"
      outputs:
        re_review_result:
          status: "string"
          feedback: "object"
      validation:
        - "Re-review complete"
        - "Final status determined"

  checkpoint:
    name: "Revision Complete"
    criteria:
      - "All critical issues addressed"
      - "Revisions verified"
      - "Final status is APPROVED or APPROVED_WITH_NOTES"
    loop:
      max_iterations: 2
      on_exceed: "escalate_to_user"

  outputs:
    revision_result:
      final_deliverable: "{{revision_02.revised_deliverable}}"
      iterations: "number"
      status: "{{revision_03.status}}"
```

---

### Phase 7: Delivery

**Purpose:** Formal handoff of completed deliverable to the user.

```yaml
phase_7:
  id: "delivery"
  name: "Final Delivery"
  duration: "15-30 minutes"
  agent: "@design-chief"

  steps:
    - id: "delivery_01"
      name: "Prepare Delivery Package"
      action: "package_deliverables"
      description: |
        Organize all deliverables, documentation, and supporting
        materials into a cohesive delivery package.
      inputs:
        final_deliverable: "{{latest_deliverable}}"
        documentation: "object"
        project_artifacts: "array"
      outputs:
        delivery_package:
          primary_deliverables: "array"
          source_files: "array"
          documentation: "array"
          review_report: "object"
          usage_guidelines: "object"
      validation:
        - "Package complete"
        - "All files accessible"

    - id: "delivery_02"
      name: "Create Delivery Summary"
      action: "create_summary"
      description: |
        Generate a summary document explaining what was delivered,
        key decisions made, and how to use the deliverables.
      inputs:
        package: "{{delivery_01.delivery_package}}"
        project_history: "object"
        review_report: "{{phase_5.review_result.report}}"
      outputs:
        delivery_summary:
          project_overview: "string"
          deliverables_list: "array"
          key_decisions: "array"
          usage_instructions: "string"
          next_steps: "string"
          contacts: "object"
      validation:
        - "Summary generated"
        - "All sections populated"

    - id: "delivery_03"
      name: "Present to User"
      action: "present_delivery"
      description: |
        Present the completed work to the user with context on
        what was done, why decisions were made, and how to proceed.
      inputs:
        package: "{{delivery_01.delivery_package}}"
        summary: "{{delivery_02.delivery_summary}}"
      outputs:
        presentation_complete: "boolean"
        user_questions: "array"
        feedback_received: "object"
      validation:
        - "Delivery presented"
        - "User questions addressed"

    - id: "delivery_04"
      name: "Gather User Feedback"
      action: "collect_feedback"
      description: |
        Collect user feedback on the delivered work and the overall
        process for continuous improvement.
      inputs:
        delivery_summary: "{{delivery_02.delivery_summary}}"
      outputs:
        user_feedback:
          satisfaction: "1-10"
          what_worked: "array"
          improvements: "array"
          would_recommend: "boolean"
          additional_needs: "array"
      validation:
        - "Feedback collected"

    - id: "delivery_05"
      name: "Identify Follow-up Opportunities"
      action: "identify_followup"
      description: |
        Based on delivered work and user feedback, identify potential
        follow-up projects or next phases.
      inputs:
        project_type: "{{phase_1.classification_result.type}}"
        deliverables: "{{delivery_01.delivery_package}}"
        feedback: "{{delivery_04.user_feedback}}"
      outputs:
        follow_up_opportunities:
          recommended: "array"
          optional: "array"
          future: "array"
      suggestions:
        after_brand_strategy: ["logo_design", "design_system"]
        after_logo: ["brand_guidelines", "design_system"]
        after_design_system: ["team_training", "governance"]
        after_thumbnail: ["more_thumbnails", "video_strategy"]
        after_photography: ["editing", "preset_creation"]
      validation:
        - "Follow-up identified"

  checkpoint:
    name: "Delivery Complete"
    criteria:
      - "Package delivered"
      - "User acknowledged receipt"
      - "Feedback collected"
      - "Follow-up identified"

  outputs:
    delivery_result:
      package: "{{delivery_01.delivery_package}}"
      summary: "{{delivery_02.delivery_summary}}"
      feedback: "{{delivery_04.user_feedback}}"
      follow_up: "{{delivery_05.follow_up_opportunities}}"
```

---

### Phase 8: Multi-Specialist Handoff (For Multi-Domain Projects)

**Purpose:** Transition to next specialist in multi-domain workflows.

```yaml
phase_8:
  id: "multi_specialist_handoff"
  name: "Multi-Specialist Transition"
  duration: "15-30 minutes"
  condition: "{{workflow_pattern}} != null AND {{more_specialists_remaining}}"
  agent: "@design-chief"

  steps:
    - id: "multi_01"
      name: "Evaluate Phase Completion"
      action: "evaluate_phase"
      description: |
        Confirm current phase deliverables are complete and ready
        for handoff to next specialist.
      inputs:
        current_phase: "object"
        deliverables: "{{phase_4.execution_result.deliverable}}"
        review_status: "{{phase_5.review_result.status}}"
      outputs:
        phase_complete: "boolean"
        ready_for_handoff: "boolean"
        gaps: "array"
      validation:
        - "Phase evaluation complete"
        - "Handoff readiness determined"

    - id: "multi_02"
      name: "Prepare Inter-Specialist Handoff"
      action: "prepare_handoff"
      description: |
        Compile handoff brief for next specialist including completed
        deliverables and context from previous phase.
      inputs:
        completed_deliverables: "{{phase_4.execution_result.deliverable}}"
        original_brief: "{{phase_3.handoff_result.brief}}"
        review_report: "{{phase_5.review_result.report}}"
        next_specialist: "{{workflow_pattern.next_specialist}}"
      outputs:
        inter_specialist_handoff:
          from_specialist: "string"
          to_specialist: "string"
          phase_completed: "string"
          phase_starting: "string"
          deliverables_transferred: "array"
          context_for_next_phase: "string"
          success_criteria_for_next: "array"
      validation:
        - "Handoff brief prepared"
        - "All deliverables included"

    - id: "multi_03"
      name: "Validate Handoff Checklist"
      action: "validate_checklist"
      description: |
        Run design-handoff-checklist for inter-specialist transition.
      inputs:
        handoff: "{{multi_02.inter_specialist_handoff}}"
      outputs:
        checklist_result:
          passed: "boolean"
          gaps: "array"
      validation:
        - "Checklist validated"

    - id: "multi_04"
      name: "Execute Handoff to Next Specialist"
      action: "execute_handoff"
      description: |
        Transfer context to next specialist in the workflow sequence.
      inputs:
        next_specialist: "{{workflow_pattern.next_specialist}}"
        handoff_brief: "{{multi_02.inter_specialist_handoff}}"
      outputs:
        handoff_complete: "boolean"
        specialist_activated: "boolean"
      validation:
        - "Handoff executed"
        - "Next specialist activated"

    - id: "multi_05"
      name: "Update Workflow State"
      action: "update_workflow_state"
      description: |
        Update workflow tracking to reflect phase transition.
      inputs:
        current_phase: "string"
        next_phase: "string"
        specialists_completed: "array"
        specialists_remaining: "array"
      outputs:
        workflow_state_updated: "boolean"
        remaining_phases: "number"
      validation:
        - "State updated"
        - "Progress tracked"

  checkpoint:
    name: "Multi-Specialist Handoff Complete"
    criteria:
      - "Previous phase validated"
      - "Handoff checklist passed"
      - "Next specialist activated"
      - "Workflow state updated"
    next_action: "return_to_phase_4_with_new_specialist"

  outputs:
    transition_result:
      previous_specialist: "string"
      previous_phase: "string"
      next_specialist: "string"
      next_phase: "string"
      handoff_record: "object"
```

---

### Phase 9: Workflow Closure

**Purpose:** Close out the workflow and archive project artifacts.

```yaml
phase_9:
  id: "closure"
  name: "Workflow Closure"
  duration: "10-15 minutes"
  agent: "@design-chief"

  steps:
    - id: "closure_01"
      name: "Compile Project Summary"
      action: "compile_summary"
      description: |
        Create comprehensive project summary including timeline,
        specialists involved, deliverables, and outcomes.
      inputs:
        all_phases: "object"
        deliverables: "array"
        feedback: "{{phase_7.delivery_result.feedback}}"
      outputs:
        project_summary:
          project_id: "string"
          project_name: "string"
          start_date: "timestamp"
          end_date: "timestamp"
          duration: "string"
          specialists_involved: "array"
          phases_completed: "array"
          deliverables_produced: "array"
          user_satisfaction: "number"
          key_learnings: "array"
      validation:
        - "Summary complete"

    - id: "closure_02"
      name: "Archive Project Artifacts"
      action: "archive_project"
      description: |
        Organize and archive all project artifacts for future reference.
      inputs:
        project_id: "{{phase_0.project_id}}"
        all_deliverables: "array"
        all_documentation: "array"
        all_reviews: "array"
      outputs:
        archive:
          location: "path"
          manifest: "object"
          size: "string"
      validation:
        - "All artifacts archived"
        - "Manifest created"

    - id: "closure_03"
      name: "Update Team Metrics"
      action: "update_metrics"
      description: |
        Update Design Squad metrics with project outcomes for
        continuous improvement tracking.
      inputs:
        project_summary: "{{closure_01.project_summary}}"
        feedback: "{{phase_7.delivery_result.feedback}}"
      outputs:
        metrics_updated: "boolean"
        performance_data:
          completion_time: "string"
          revision_rounds: "number"
          satisfaction_score: "number"
      validation:
        - "Metrics updated"

    - id: "closure_04"
      name: "Close Session"
      action: "close_session"
      description: |
        Formally close the workflow session and reset state.
      inputs:
        project_id: "{{phase_0.project_id}}"
        session_id: "{{phase_0.session_id}}"
      outputs:
        session_closed: "boolean"
        final_status: "COMPLETED | COMPLETED_WITH_NOTES | PARTIAL"
      validation:
        - "Session closed"
        - "State reset"

  checkpoint:
    name: "Workflow Complete"
    criteria:
      - "Project summary created"
      - "Artifacts archived"
      - "Metrics updated"
      - "Session closed"

  outputs:
    closure_result:
      project_summary: "{{closure_01.project_summary}}"
      archive_location: "{{closure_02.archive.location}}"
      final_status: "{{closure_04.final_status}}"
```

---

## Global Configuration

```yaml
global:
  error_handling:
    on_error: "log_and_continue"
    escalation_path: "@design-chief -> user"
    retry_policy:
      max_retries: 2
      backoff: "exponential"

  notifications:
    enabled: true
    channels:
      - type: "console"
        events: ["phase_complete", "checkpoint_failed", "workflow_complete"]
      - type: "session_state"
        events: ["all"]

  security:
    authorization_required: false
    audit_logging: true
    sensitive_data_handling: "mask_in_logs"

  performance:
    parallel_execution: true
    timeout_per_phase: "24 hours"
    total_workflow_timeout: "8 weeks"

state_management:
  persistence: "file"
  location: "{{project_folder}}/.workflow-state.yaml"
  checkpoint_frequency: "per_phase"
  recovery_enabled: true
```

---

## Workflow Variants

```yaml
variants:
  quick_project:
    description: "Single specialist, single deliverable"
    phases: [0, 1, 2, 3, 4, 5, 7, 9]
    skip: [6, 8]
    estimated_duration: "1-3 days"

  standard_project:
    description: "Single specialist, with revision cycle"
    phases: [0, 1, 2, 3, 4, 5, 6, 7, 9]
    skip: [8]
    estimated_duration: "1-2 weeks"

  multi_domain_project:
    description: "Multiple specialists, sequential phases"
    phases: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    loop: "phases 4-8 per specialist"
    estimated_duration: "4-8 weeks"
```

---

## Notes

- Design Chief orchestrates but never executes design work
- Each specialist brings domain expertise to their phase
- Handoff quality directly impacts subsequent phase success
- User can exit workflow at any checkpoint
- Partial completion is valid (with documentation)
- This workflow integrates with `design-triage.md` and `design-review-orchestration.md` tasks

---

**Workflow Version:** 1.0.0
**Last Updated:** 2026-02-02
**Owner:** @design-chief
