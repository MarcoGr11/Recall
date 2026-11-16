/** Input model — mirrors the future API (courses + topics with SM-2 progress). */
export interface Topic {
  id: string;
  title: string;
  /** 0..1 */
  mastery: number;
  /** ISO date-time */
  lastReviewedAt?: string;
  /** ISO date-time */
  dueAt?: string;
}

export interface Course {
  id: string;
  title: string;
  color?: string;
  topics: Topic[];
}

export interface TreeInput {
  studentId: string;
  courses: Course[];
}

/** Centerline sample of a tapered limb: position, full width, distance from the limb base. */
export interface LimbSample {
  x: number;
  y: number;
  w: number;
  d: number;
}

export interface Limb {
  /** 'trunk', 'root-N' or the course id. */
  id: string;
  samples: LimbSample[];
  length: number;
  /** Closed SVG outline of the fully grown limb. */
  path: string;
}

export interface Branch extends Limb {
  courseId: string;
  slot: number;
}

export interface Leaf {
  topicId: string;
  courseId: string;
  /** Leaf base (twig tip). */
  x: number;
  y: number;
  /** Radians, direction from leaf base to leaf tip. */
  rotation: number;
  size: number;
  /** Twig attach point on the branch. */
  ax: number;
  ay: number;
}

export interface TreePrimitives {
  width: number;
  height: number;
  groundY: number;
  trunk: Limb;
  roots: Limb[];
  branches: Branch[];
  leaves: Leaf[];
}
