use crate::EditRange;
use diff::{lines, Result as DiffResult};

pub fn compute_diff(baseline: &str, current: &str) -> String {
    let mut output = String::new();
    
    for result in lines(baseline, current) {
        match result {
            DiffResult::Left(l) => output.push_str(&format!("- {}\n", l)),
            DiffResult::Both(l, _) => output.push_str(&format!("  {}\n", l)),
            DiffResult::Right(r) => output.push_str(&format!("+ {}\n", r)),
        }
    }
    
    output
}

pub fn compute_edit_ranges(baseline: &str, current: &str) -> Vec<EditRange> {
    let mut edits = Vec::new();
    let mut before_idx = 0;
    let mut after_idx = 0;
    
    for result in lines(baseline, current) {
        match result {
            DiffResult::Left(_) => {
                // Line removed from baseline
                let edit = EditRange {
                    before_start: before_idx,
                    before_end: before_idx + 1,
                    after_start: after_idx,
                    after_end: after_idx,
                };
                edits.push(edit);
                before_idx += 1;
            }
            DiffResult::Right(_) => {
                // Line added in current
                let edit = EditRange {
                    before_start: before_idx,
                    before_end: before_idx,
                    after_start: after_idx,
                    after_end: after_idx + 1,
                };
                edits.push(edit);
                after_idx += 1;
            }
            DiffResult::Both(_, _) => {
                // Lines match
                before_idx += 1;
                after_idx += 1;
            }
        }
    }
    
    edits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_diff() {
        let baseline = "line 1\nline 2\nline 3";
        let current = "line 1\nline 2 modified\nline 3";
        let diff = compute_diff(baseline, current);
        assert!(diff.contains("- line 2"));
        assert!(diff.contains("+ line 2 modified"));
    }

    #[test]
    fn test_compute_edit_ranges() {
        let baseline = "line 1\nline 2\nline 3";
        let current = "line 1\nline 2 modified\nline 3";
        let edits = compute_edit_ranges(baseline, current);
        assert!(!edits.is_empty());
    }
}
