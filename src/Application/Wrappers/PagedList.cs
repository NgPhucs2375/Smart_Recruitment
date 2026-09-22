using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Wrappers
{
    public class PagedList<T> : List<T>
    {
        // Legacy offset API (giữ để không vỡ Identity modules): _start=offset, _end=end-index
        public int _start { get; private set; }
        public int _end { get; private set; }
        public int _total { get; private set; }
        public int _pages { get; private set; }
        public bool _hasPrevious => HasPrevious;
        public bool _hasNext => HasNext;

        // New page-based API
        public int PageNumber { get; private set; }
        public int PageSize { get; private set; }
        public int TotalPages { get; private set; }
        public int TotalCount { get; private set; }

        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;

        public PagedList(List<T> items, int count, int _start, int _end)
        {
            _total = count;
            TotalCount = count;
            this._end = _end;
            this._start = _start;
            var size = _end - _start;
            if (size < 1) size = _end > 0 ? _end : 20;
            PageSize = size;
            PageNumber = size > 0 ? (_start / size) + 1 : 1;
            if (PageNumber < 1) PageNumber = 1;
            _pages = (int)Math.Ceiling(count / (double)size);
            TotalPages = _pages;
            AddRange(items);
        }

        public PagedList(List<T> items, int count, int pageNumber, int pageSize, bool byPage)
        {
            TotalCount = count;
            _total = count;
            PageSize = pageSize < 1 ? 20 : pageSize;
            PageNumber = pageNumber < 1 ? 1 : pageNumber;
            TotalPages = (int)Math.Ceiling(count / (double)PageSize);
            _pages = TotalPages;
            _start = (PageNumber - 1) * PageSize;
            _end = _start + PageSize;
            AddRange(items);
        }

        /// <summary>Legacy: offset (_start=skip, _end=end-index).</summary>
        public static async Task<PagedList<T>> ToPagedList(IQueryable<T> source, int _start, int _end, CancellationToken cancellationToken = default)
        {
            if (_start < 0) _start = 0;
            var count = await source.CountAsync(cancellationToken);
            var items = await source.Skip(_start).Take(_end - _start).ToListAsync(cancellationToken);
            return new PagedList<T>(items, count, _start, _end);
        }

        /// <summary>Mới: phân trang theo pageNumber/pageSize.</summary>
        public static async Task<PagedList<T>> ToPagedListByPage(IQueryable<T> source, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;
            var count = await source.CountAsync(cancellationToken);
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
            return new PagedList<T>(items, count, pageNumber, pageSize, byPage: true);
        }

        public static PagedList<T> ToPagedList(IEnumerable<T> source, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;
            var list = source as IList<T> ?? source.ToList();
            var count = list.Count;
            var items = list.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
            return new PagedList<T>(items, count, pageNumber, pageSize, byPage: true);
        }
    }
}
