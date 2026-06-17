import { Handle, Position } from '@xyflow/react';

export const CourseNode = ({ data }) => {
  const { title, category, status, special } = data;

  return (
    <div className={`course-node status-${status} cat-${category} ${special ? 'special' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <span className="course-category">{category.replace('_', ' ')}</span>
      <h3>
        {status === 'locked' && <span className="lock-icon">🔒</span>}
        {status === 'completed' && <span className="lock-icon">✅</span>}
        {title}
      </h3>
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};
